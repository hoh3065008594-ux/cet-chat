import oss2, os, sys, json

EP = 'oss-cn-hangzhou.aliyuncs.com'
BN = 'cet-chat-xrsh'
DIST = os.path.join(os.path.dirname(__file__), '..', 'dist')

AK = os.environ.get('OSS_AK') or input('AccessKey ID: ').strip()
SK = os.environ.get('OSS_SK') or input('AccessKey Secret: ').strip()

auth = oss2.Auth(AK, SK)
bucket = oss2.Bucket(auth, EP, BN)

# Ensure public access
policy = {
    'Version': '1',
    'Statement': [{
        'Effect': 'Allow',
        'Action': ['oss:GetObject'],
        'Principal': ['*'],
        'Resource': [f'acs:oss:*:*:{BN}/*']
    }]
}
bucket.put_bucket_policy(json.dumps(policy))
bucket.put_bucket_website(oss2.models.BucketWebsite('index.html', 'index.html'))

ctypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
}

for root, _, files in os.walk(DIST):
    for f in files:
        path = os.path.join(root, f)
        key = os.path.relpath(path, DIST).replace('\\', '/')
        ext = os.path.splitext(f)[1].lower()
        ct = ctypes.get(ext, 'application/octet-stream')
        # Force inline display, prevent download
        bucket.put_object_from_file(key, path, headers={
            'Content-Type': ct,
            'Content-Disposition': 'inline',
        })
        bucket.put_object_acl(key, oss2.OBJECT_ACL_PUBLIC_READ)
        print(f'  [{key}] OK')

print(f'\nDone: http://{BN}.{EP}')
