## Gallery Card

A custom card for Home Assistant that will display images and/or videos from a folder in the style of a gallery.

### [Docs (installation, config, and issues)](https://github.com/TarheelGrad1998/gallery-card)

### Features

- Displays images or files (requires files component)
- Also supports adding cameras for live camera images
- Customizable menu
- Parsing Date/Time from filename for cleaner captions

<img style="border: 5px solid #767676;border-radius: 10px;max-width: 350px;width: 100%;box-sizing: border-box;" src="https://raw.githubusercontent.com/TarheelGrad1998/gallery-card/master/screenshot.png" alt="Screen Shot">

```yaml
resources:
  - url: /community_plugin/gallery-card/gallery-card.js
    type: module
```
