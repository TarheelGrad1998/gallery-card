# Gallery Card

Custom card for Home Assistant's UI LoveLace which will display images and videos in the style of a gallery.

This was developed for use alongside the [component for Kuna cameras](https://github.com/marthoc/kuna) but should work with any images/videos, in theory.

![Screenshot](https://github.com/TarheelGrad1998/GalleryCard/raw/master/screenshot.png)

## Installation - Files Component

Files that will appear in the gallery must be in the WWW folder, ideally in a subfolder. This component will periodically scan the folder for changes to the files, and is based on the built-in Folder component.

1. Create a folder in your `config` directory named `custom_components`
2. Create a folder in your `custom_components` named `files`
3. Copy the 3 files (_init_.py, manifest.json, and sensor.py) into the `files` folder
4. Create a folder in your `WWW` folder named `images` (or any other name, but be sure to use the proper name below)
5. Add your images/videos to this folder
6. Add the files sensor to your configuration.yaml file
    ```yaml
    - sensor
        - platform: files
          folder: /config/www/images
          name: gallery_images
          sort: date
    ```
7. Restart Home Assistant
8. Check the sensor.gallery_images entity to see if the `fileList` attribute lists your files

### Configuration Variables - Files Component

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| platform | string | **Required** | `files`
| folder | string | **Required** | Folder to scan, must be /config/www/***
| name | string | **Required** | The entity ID for the sensor
| sort | string | **Optional** | One of 'name', 'date', or 'size';  Determines how files are sorted in the Gallery, `Default: date`

## Installation - Gallery Card
For more details, see [Thomas Loven's Install Guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

1.  Place the `gallary-card.js` file under your `/config/www/` folder of Home Assistant (suggest - create a subdirectory for `cards`)
2.  Add the card within the resources section (Config -> Lovelace Dashboards -> Resources)
    URL: /local/cards/gallery-card.js
    Type: Javascript Module
3.  Add the gallery card to your Lovelace configuration.  Use of the viual editor is preferred, but the below example is if using the code editor:
    ```
    type: 'custom:gallery-card'
    entity: sensor.gallery_images
    menu_alignment: Responsive
    maximum_files: 10
    file_name_format: '%YYY_%m_%d_%H_%M_%S'
    caption_format: '%m/%d %H:%M %p'  
    ```
I recommend adding the card to a view set to Panel Mode for best results.

### Configuration Variables - Gallery Card
Whether using the editor or yaml, the following configurations can be used:

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | **Required** | The entity_id of the files sensor added above
| title | string | **Optional** | The name to show at the top of the card.  
| menu_alignment | string | **Optional** | Alignment of the menu (the small list of images/videos to view).  Default is if not specified is Responsive (see below)
| maximum_files | integer | **Optional** | The number of files to show in the gallery list.  You may want to limit videos to make it perform better and to conserve bandwith.  Used in combination with sort (using the config as above, the latest 10 by date will be shown)
| file_name_format | string | **Optional** | The format of the file names (see below).  Used in combination with caption_format for the captions below the image/video.
| caption_format | string | **Optional** | The format of the caption (see below).  Used in combination with file_name_format.

## Menu Alignment
Available options for Menu Alignment are below:

| Value | Description
| ----------- | -----------
| Responsive | On wider views (e.g. landscape >= 600px) uses the Right alignment, on narrower views (e.g. portrait < 600px) the Bottom
| Left | Always shows a vertical list on the left of the card.
| Right | Always shows a vertical list on the right of the card (shown in the image above).
| Top | Always shows a horizontal list on the top of the card.
| Botom | Always shows a vertical list on the bottom of the card.
| Hidden | Hides the list and only shows the larger image

## Caption Configuration
The captions under the image/video is formatted using file_name_format and caption_format.  If either is ommitted, the raw filename is used.

The assumption is that the file name contains the date formatted such that it can be parsed and formatted for easier human consumption.  
Use the following placeholders for the date components:

| Placeholder | Description
| ----------- | -----------
| %YYY | A 4 digit year, e.g. 2019
| %m | The 2 digit month
| %d | The 2 digit day
| %H | The 2 digit hour
| %M | The 2 digit minute
| %S | The 2 digit seconds
| %p | 2 digits AM or PM (if included in caption_format, the output will be converted to 12 hour, if not the value will remain as the %H placeholder)

Example:
* file_name_format: "%YYY_%m_%d__%H_%M_%S-0400"
	* Assumes the file name is in the format 2019_06_19__20_00_00-0400
* caption_format: "%m/%d %H:%M %p"	
	* Will parse the file name and return a date formatted as 06/19 08:00 PM

## Credits

The files component largely taken from work done by @zsarnett in [the slideshow card](https://github.com/zsarnett/slideshow-card), from which other inspiration was also taken.  
