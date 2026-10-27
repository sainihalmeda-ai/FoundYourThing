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

# Hostel complaint box. The app reads this list from
# GET /api/hostel-complaints/options, so adding a hostel or its blocks here
# is the only change needed. A hostel with an empty `blocks` list doesn't ask
# for a block — fill the list in once its block names are known.
# Keys are stored on complaints, so never rename one; change `label` instead.
HOSTELS: dict[str, dict] = {
    # Boys
    "prince": {"label": "Prince Hostel", "group": "boys", "blocks": ["A", "B", "C", "D", "E", "F"]},
    "leaders": {"label": "Leaders Hostel", "group": "boys", "blocks": []},
    "kings": {"label": "Kings Hostel", "group": "boys", "blocks": []},
    "lords": {"label": "Lords Hostel", "group": "boys", "blocks": []},
    "balaji": {"label": "Balaji Hostel", "group": "boys", "blocks": []},
    "heroes": {"label": "Heroes Hostel", "group": "boys", "blocks": []},
    "national": {"label": "National Hostel", "group": "boys", "blocks": []},
    "international": {"label": "International Hostel", "group": "boys", "blocks": []},
    # Girls
    "queens": {"label": "Queens Hostel", "group": "girls", "blocks": []},
    "padmavathi": {"label": "Padmavathi Hostel", "group": "girls", "blocks": []},
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
