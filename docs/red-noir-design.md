# Red Noir Design System

## Visual Style

Dark luxury aesthetic with red accents. Deep blacks (#000000, #1a0505) with bold red highlights (#ef233c) creating high contrast and sophistication.

## Color Palette

- **Primary Dark**: #000000, #1a0505
- **Accent Red**: #ef233c
- **Accent Red Glow**: rgba(239, 35, 60, 0.5)
- **Neutral Gray**: #1f2937, #3f3f46, #52525b, #71717a, #a1a1aa
- **Surface**: #09090b, #18181b, #27272a, #3f3f46
- **Text**: #ffffff, #f4f4f5, #e4e4e7
- **Muted**: #a1a1aa, #71717a, #52525b

## Typography

- **Headlines**: Manrope (600, 700, 800 weight) - bold, tight tracking
- **Body**: Inter (300, 400, 500, 600 weight) - clean, readable
- **Accent**: Manrope for emphasis, uppercase tracking

## Design Elements

### Navbar

```html
<nav class="fixed top-0 left-0 w-full z-50 pt-6 px-4">
    <div class="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl">
        <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-[#ef233c] rounded-sm rotate-45"></div>
            <span class="text-lg font-bold font-manrope tracking-tight">Brand</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
            <a href="#" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Link</a>
        </div>
        <div class="flex items-center gap-4">
            <a href="#" class="text-sm font-medium text-zinc-300">Login</a>
            <button class="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform">
                <span class="relative z-10 text-xs font-bold uppercase">CTA</span>
            </button>
        </div>
    </div>
</nav>
```

### Shiny CTA Button (Animated Border)

```css
.shiny-cta {
    --gradient-angle: 0deg;
    position: relative;
    overflow: hidden;
    border-radius: 9999px;
    padding: 1rem 2.5rem;
    background: linear-gradient(#000000, #000000) padding-box,
        conic-gradient(from var(--gradient-angle), transparent 0%, #ef233c 5%, #ef233c 15%, #ef233c 30%, transparent 40%, transparent 100%) border-box;
    border: 2px solid transparent;
    cursor: pointer;
    isolation: isolate;
    animation: border-spin 2.5s linear infinite;
}

@keyframes border-spin {
    from { --gradient-angle: 0deg; }
    to { --gradient-angle: 360deg; }
}
```

### Hero Section

- Large hero with staggered fade-in animations
- Gradient text (white to semi-transparent white)
- Red accent word with decorative SVG underline
- Call-to-action buttons (primary red, secondary dark)

### Feature Cards

- Dark cards with subtle borders (white/10)
- Hover effects with semi-transparent gradient overlays
- Icon badges with colored backgrounds
- Minimal text with breathing room

### Testimonial Section

- Full-width red accent color (#ef233c)
- Black text on red background
- 5-star rating display
- User avatar + name/title

### Pricing Cards

- 3-column grid with recommended card scaled up
- Dark borders, red accent on recommended tier
- Check icons in red
- Clear hierarchy

## Animation & Effects

### Fade-In-Up

```css
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-in-up 0.8s ease-out forwards; }
```

### Parallax Stars

- Two layers of stars moving at different speeds
- Creates depth and movement without UI distraction

### Hover Effects

- Border color transitions (white/10 → white/20)
- Subtle gradient glows on hover
- Text reveals and transforms

## Key Principles

1. **Dark Luxury**: Black is the dominant color, red is the luxury accent
2. **High Contrast**: White text on black for maximum readability
3. **Intentional Motion**: Animations serve purpose, not decoration
4. **Breathing Room**: Generous padding and spacing
5. **Premium Details**: Glowing borders, backdrop blur, subtle gradients
6. **Typography Hierarchy**: Manrope for impact, Inter for clarity
