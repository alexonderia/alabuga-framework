"""Install the pinned official Windows runtime with its compact Vulkan backend.

Range downloads avoid fetching CUDA libraries for multiple GPU generations.
Every extracted member is checked against the official ZIP's size and CRC.
"""
import concurrent.futures, hashlib, io, json, pathlib, struct, time, urllib.request, zipfile, zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / '.local' / 'ollama'
VERSION = 'v0.35.0'
URL = f'https://github.com/ollama/ollama/releases/download/{VERSION}/ollama-windows-amd64.zip'
SIZE = 1461196158
ROOT.mkdir(parents=True, exist_ok=True)

def fetch(start, end):
    if end-start+1 > 2*1024*1024:
        parts = [(offset, min(offset+512*1024-1, end)) for offset in range(start, end+1, 512*1024)]
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as chunks:
            return b''.join(chunks.map(lambda p: fetch(*p), parts))
    for attempt in range(4):
        try:
            req = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{end}'})
            with urllib.request.urlopen(req, timeout=90) as response:
                data = response.read()
                if response.status != 206 or len(data) != end-start+1:
                    raise ValueError('Invalid range response')
                return data
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)

tail_start = SIZE-131072
tail = fetch(tail_start, SIZE-1)
archive = zipfile.ZipFile(io.BytesIO(tail))
members = [m for m in archive.infolist() if not m.is_dir() and '/cuda_' not in m.filename]
def install(m):
    target = (ROOT / m.filename).resolve()
    if not target.is_relative_to(ROOT.resolve()):
        raise ValueError('Unsafe archive path')
    if target.exists() and target.stat().st_size == m.file_size and zlib.crc32(target.read_bytes()) == m.CRC:
        return m.filename
    offset = m.header_offset+tail_start
    header = fetch(offset, offset+29)
    if header[:4] != b'PK\x03\x04':
        raise ValueError('Invalid ZIP member')
    name_len, extra_len = struct.unpack_from('<HH', header, 26)
    start = offset + 30 + name_len + extra_len
    compressed = fetch(start, start+m.compress_size-1)
    data = zlib.decompress(compressed, -15) if m.compress_type == 8 else compressed
    if len(data) != m.file_size or zlib.crc32(data) != m.CRC:
        raise ValueError('Corrupt ZIP member: '+m.filename)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(m.filename, 'verified', flush=True)
    return m.filename

with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
    installed = list(pool.map(install, members))
(ROOT / 'installation.json').write_text(json.dumps({'version': VERSION, 'source': URL, 'backend': 'Vulkan', 'files': {name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in installed}}, indent=2))
print('Official Ollama runtime installed (Vulkan).', flush=True)
