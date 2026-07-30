"""Generate Idea Quest 2026 PPT for FoundYourThing."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "FoundYourThing_IdeaQuest2026.pptx"

PRIMARY = RGBColor(0x1B, 0x4D, 0x89)
ACCENT = RGBColor(0x0E, 0xA5, 0xA4)
DARK = RGBColor(0x10, 0x2A, 0x43)
MUTED = RGBColor(0x62, 0x7D, 0x98)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF4, 0xF7, 0xFB)


def set_slide_bg(slide, color: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_title_block(slide, title: str, subtitle: str = "") -> None:
    box = slide.shapes.add_textbox(Inches(0.6), Inches(0.35), Inches(12.1), Inches(1.2))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(16)
        p2.font.color.rgb = MUTED
        p2.space_before = Pt(6)


def add_bullets(slide, items: list[str], left=0.75, top=1.55, width=11.8, height=5.5, size=20):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = item
        p.level = 0
        p.font.size = Pt(size)
        p.font.color.rgb = DARK
        p.space_after = Pt(10)


def add_footer(slide, text: str) -> None:
    box = slide.shapes.add_textbox(Inches(0.6), Inches(6.85), Inches(12), Inches(0.4))
    p = box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(11)
    p.font.color.rgb = MUTED


def slide_title(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, LIGHT_BG)

    # Accent bar
    bar = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.33), Inches(0.18))
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT
    bar.line.fill.background()

    title = slide.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.5), Inches(1.5))
    p = title.text_frame.paragraphs[0]
    p.text = "FOUND YOUR THING"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.alignment = PP_ALIGN.CENTER

    tag = slide.shapes.add_textbox(Inches(0.8), Inches(2.9), Inches(11.5), Inches(1.2))
    tf = tag.text_frame
    tf.word_wrap = True
    lines = [
        "AI-Powered Privacy-First Campus Lost & Found System",
        "(Lost on campus. Found by intelligence.)",
        "(Campus lost & found, reimagined for students.)",
    ]
    for i, line in enumerate(lines):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.text = line
        para.alignment = PP_ALIGN.CENTER
        para.font.size = Pt(18 if i == 0 else 15)
        para.font.color.rgb = DARK if i == 0 else MUTED
        para.space_after = Pt(4)

    meta = slide.shapes.add_textbox(Inches(0.8), Inches(4.8), Inches(11.5), Inches(1.8))
    tf = meta.text_frame
    meta_lines = [
        "Presented by: Meda Sai Nihal",
        "Department: CSE  |  Specialization: AI & Data Science",
        "Project Category: AI & Mobile-based Smart Campus Application",
        "SDG 11: Sustainable Cities and Communities",
        "Idea Quest 2026",
    ]
    for i, line in enumerate(meta_lines):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.text = line
        para.alignment = PP_ALIGN.CENTER
        para.font.size = Pt(14)
        para.font.color.rgb = DARK
        para.space_after = Pt(3)


def build_presentation() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    slide_title(prs)

    slides_content = [
        (
            "Slide 2: Problem Statement",
            "Why campus lost & found needs a digital solution",
            [
                "Students frequently lose valuable items on campus — phones, watches, wallets, ID cards, and bags.",
                "Common recovery methods (notice boards, WhatsApp groups, word of mouth) are slow and unstructured.",
                "Manual matching depends on luck — two people must find each other without a central system.",
                "Privacy risk: students often share phone numbers publicly while searching for lost items.",
                "Low-value clutter (pens, pencils) makes traditional boards noisy and ineffective.",
                "Result: delayed recovery, stress, replacement cost, and wasted student time.",
            ],
        ),
        (
            "Slide 3: Proposed Solution",
            "FoundYourThing — smart, safe, campus-wide recovery",
            [
                "A cross-platform mobile/web app for reporting LOST and FOUND valuable items only.",
                "Users upload a photo + category + location + short description.",
                "AI compares lost and found reports using image + text similarity and shows match score (%).",
                "Privacy-first design: only VTU/college ID is public initially.",
                "Phone numbers are shared only after owner requests contact and finder accepts.",
                "Built for real campus use — Canteen, Library, Hostel, Departments, and more.",
            ],
        ),
        (
            "Slide 4: Architecture / Workflow",
            "End-to-end system design",
            [
                "Mobile App (Expo React Native) ↔ REST API (Python FastAPI) ↔ SQLite/PostgreSQL",
                "Image + text embeddings generated on upload; cosine similarity ranks possible matches.",
                "Workflow:",
                "  1. Student reports lost item → visible on campus feed",
                "  2. Another student reports found item → AI matching runs automatically",
                "  3. Owner sees possible match → sends contact request",
                "  4. Finder accepts → both receive name, department, and phone",
                "Privacy service controls what data is visible at each stage (Public → Match → Claim → Connected).",
            ],
        ),
        (
            "Slide 5: Expected Impact",
            "Benefits for students and institution",
            [
                "Faster recovery of valuable belongings through intelligent matching.",
                "Safer campus community with consent-based contact sharing.",
                "Reduced replacement cost and waste (supports SDG 12 indirectly).",
                "Organized digital lost & found instead of scattered social media posts.",
                "Supports SDG 11: Sustainable Cities and Communities — safer, inclusive campus life.",
                "Scalable model for college-wide adoption with VTU ID verification in future.",
            ],
        ),
        (
            "Slide 6: Feasibility & Implementation Plan",
            "Realistic plan for a solo student project",
            [
                "Phase 1 (Done): Backend API, auth, item reports, AI matching MVP, mobile UI",
                "Phase 2: Improve AI with CLIP + sentence-transformers for better accuracy",
                "Phase 3: Push notifications for urgent lost valuables (not pens/pencils)",
                "Phase 4: College integration — verified student/faculty database (VTU ID API)",
                "Phase 5: Admin moderation panel + cloud deployment (Render + PostgreSQL)",
                "Tech feasibility: Python (AI/DS), Expo (Android/iOS/Web), proven open-source stack.",
            ],
        ),
        (
            "Slide 7: Scalability & Future Scope",
            "Growth beyond Minor Project 1",
            [
                "Multi-campus support with separate feeds per institution.",
                "Official college onboarding with SSO and role badges (Student / Faculty).",
                "Smart alerts: urgent broadcasts only for high-value items.",
                "Auto-blur for ID card photos and abuse reporting system.",
                "Analytics dashboard for admin — recovery rate, popular loss locations.",
                "Optional: chatbot assistant, QR tags on valuables, integration with security office.",
            ],
        ),
    ]

    for title, subtitle, bullets in slides_content:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        set_slide_bg(slide, WHITE)
        add_title_block(slide, title, subtitle)
        add_bullets(slide, bullets)
        add_footer(slide, "FoundYourThing  |  github.com/sainihalmeda-ai/FoundYourThing")

    # Slide 8: Demo / Prototype intro
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_title_block(slide, "Slide 8: Demo / Prototype", "Live application — FoundYourThing")
    add_bullets(
        slide,
        [
            "Working prototype with:",
            "  • User registration & login (VTU ID)",
            "  • Report lost / found valuable items with photo",
            "  • Campus feed & item details",
            "  • AI match suggestions with confidence score",
            "  • Privacy-gated contact request flow",
            "Platform: Expo mobile app + web browser + FastAPI backend",
            "Next slides: Application screenshots (add your prototype photos below)",
        ],
        size=19,
    )
    add_footer(slide, "FoundYourThing  |  Demo available on request")

    # Slides 9 & 10: Empty prototype photo placeholders
    for num in (9, 10):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        set_slide_bg(slide, LIGHT_BG)
        add_title_block(slide, f"Slide {num}: Prototype Screenshots", "Insert your app photos here")

        placeholder = slide.shapes.add_shape(
            1, Inches(1.2), Inches(1.8), Inches(10.9), Inches(4.8)
        )
        placeholder.fill.solid()
        placeholder.fill.fore_color.rgb = WHITE
        placeholder.line.color.rgb = ACCENT
        placeholder.line.width = Pt(2)

        box = slide.shapes.add_textbox(Inches(1.4), Inches(3.5), Inches(10.5), Inches(1.2))
        tf = box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = "[ ADD SCREENSHOT HERE ]\n\nSuggested: Login / Home / Report Lost / AI Match / Claim Flow"
        p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(22)
        p.font.color.rgb = MUTED

        add_footer(slide, "FoundYourThing  |  Replace placeholder with your prototype image")

    return prs


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs = build_presentation()
    prs.save(OUTPUT)
    print(f"Saved: {OUTPUT}")


if __name__ == "__main__":
    main()
