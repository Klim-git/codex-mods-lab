import json, struct, pathlib

class Asar:
    def __init__(self, path):
        self.path = pathlib.Path(path)
        with self.path.open('rb') as f:
            self.header = struct.unpack('<4I', f.read(16))
            self.tree = json.loads(f.read(self.header[3]))
            self.base = 8 + self.header[1]
    def entry(self, name):
        item = self.tree
        for part in name.split('/'):
            if part not in ('', '.'):
                item = item['files'][part]
        return item
    def read(self, name):
        item = self.entry(name)
        if item.get('unpacked'):
            return pathlib.Path(str(self.path)+'.unpacked', name).read_bytes()
        with self.path.open('rb') as f:
            f.seek(self.base+int(item['offset']))
            return f.read(item['size'])
    def files(self, node=None, prefix=''):
        for name,item in (self.tree if node is None else node).get('files', {}).items():
            full=prefix+name
            if 'files' in item: yield from self.files(item, full+'/')
            else: yield full,item
