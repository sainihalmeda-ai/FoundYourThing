"""Campus lost & found constants."""

# Only high-value items — no pens, pencils, or small stationery.
VALUABLE_CATEGORIES: dict[str, str] = {
    "mobile_phone": "Mobile Phone",
    "laptop_tablet": "Laptop / Tablet",
    "watch": "Watch",
    "wallet": "Wallet",
    "id_card": "ID Card",
    "bag_backpack": "Bag / Backpack",
    "keys": "Keys",
    "earbuds_headphones": "Earbuds / Headphones",
    "spectacles": "Spectacles",
    "other_valuable": "Other Valuable",
}

CAMPUS_LOCATIONS = [
    "Canteen",
    "Library",
    "Main Block",
    "CS Department",
    "EE Department",
    "Mechanical Block",
    "Sports Ground",
    "Hostel",
    "Parking",
    "Auditorium",
    "Other",
]

CONCERN_CATEGORIES: dict[str, str] = {
    "ragging": "Ragging",
    "harassment": "Harassment",
    "bullying": "Bullying",
    "other": "Other safety concern",
}

# Hostel complaint box. Hostel names and blocks are placeholders — replace
# them with the campus's real ones here; the app reads this list from
# GET /api/hostel-complaints/options, so nothing else needs to change.
HOSTELS: dict[str, dict] = {
    "boys_1": {"label": "Boys Hostel 1", "blocks": ["A", "B", "C", "D"]},
    "boys_2": {"label": "Boys Hostel 2", "blocks": ["A", "B", "C", "D"]},
    "boys_3": {"label": "Boys Hostel 3", "blocks": ["A", "B", "C"]},
    "girls_1": {"label": "Girls Hostel 1", "blocks": ["A", "B", "C"]},
    "girls_2": {"label": "Girls Hostel 2", "blocks": ["A", "B"]},
}

HOSTEL_COMPLAINT_CATEGORIES: dict[str, str] = {
    "plumbing": "Plumbing / water leakage",
    "food": "Food quality / spoilage",
    "electrical": "Electrical / lights / fans",
    "water_supply": "Water supply",
    "cleanliness": "Cleanliness / housekeeping",
    "furniture": "Furniture / room damage",
    "pests": "Pests / insects",
    "internet": "Wi-Fi / internet",
    "other": "Other hostel issue",
}

# A complaint must explain the problem properly — see services/complaint_text.py.
MIN_COMPLAINT_WORDS = 200
MAX_COMPLAINT_WORDS = 1500

# Privacy disclosure stages
DISCLOSURE_PUBLIC = "public"       # VTU ID only
DISCLOSURE_MATCH = "match"         # VTU ID + match score
DISCLOSURE_CLAIM = "claim"         # Name + department on claim request
DISCLOSURE_CONNECTED = "connected"  # Full contact after mutual consent
