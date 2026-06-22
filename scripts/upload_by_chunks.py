import urllib.parse
import urllib.request
import base64

# Read setup_live.sh
with open('setup_live.sh', 'rb') as f:
    data = f.read()

# Base64 encode
b64 = base64.b64encode(data).decode('utf-8')

# Clean old files first
print("Cleaning old files on remote...")
clean_url = "https://satishverma0870-vitacard-healthcare.hf.space/debug-exec?cmd=rm%20-f%20/tmp/setup_live.sh%20/tmp/setup_live.sh.b64"
urllib.request.urlopen(clean_url).read()

# Send in chunks of 1000 characters
chunk_size = 1000
print(f"Uploading {len(b64)} base64 characters in chunks of {chunk_size}...")
for i in range(0, len(b64), chunk_size):
    chunk = b64[i:i+chunk_size]
    cmd = f"echo -n '{chunk}' >> /tmp/setup_live.sh.b64"
    url = f"https://satishverma0870-vitacard-healthcare.hf.space/debug-exec?cmd={urllib.parse.quote(cmd)}"
    urllib.request.urlopen(url).read()
    print(f"Uploaded chunk {i//chunk_size + 1}/{((len(b64)-1)//chunk_size) + 1}")

# Decode and make executable
print("Decoding base64 and setting permissions...")
decode_cmd = "base64 -d /tmp/setup_live.sh.b64 > /tmp/setup_live.sh && chmod +x /tmp/setup_live.sh"
decode_url = f"https://satishverma0870-vitacard-healthcare.hf.space/debug-exec?cmd={urllib.parse.quote(decode_cmd)}"
urllib.request.urlopen(decode_url).read()

print("File uploaded and made executable successfully!")
