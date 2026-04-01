import json
from pywebpush import generate_vapid_keypair

keys = generate_vapid_keypair()
print(f"\nVAPID_PRIVATE_KEY={keys['private_key']}")
print(f"VAPID_PUBLIC_KEY={keys['public_key']}\n")
