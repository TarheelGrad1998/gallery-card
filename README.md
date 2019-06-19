# Gallery Panel

Custom panel for Home Assistant's UI LoveLace which will display images and videos in the style of a gallery.

This was developed for use alongside the [component for Kuna cameras](https://github.com/marthoc/kuna) but should work with any images/videos, in theory.

![Screenshot](https://github.com/TarheelGrad1998/GalleryPanel/raw/master/screenshot.png)

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

## Installation - Gallery Panel

1.  Create a folder in your `config` directory named `panels`
2.  Copy the gallery.html file into the `panels` folder
3.  Add the gallery panel to your configuration.yaml file
    ```yaml
    panel_custom:
      - name: gallery
	    sidebar_title: My Gallery
            sidebar_icon: mdi:cctv
            config: 
	      title: My Gallery
              tabs:
	      - name: Images
                entity_id: sensor.gallery_images
                maximum_files: 10
                file_name_format: "%YYY_%m_%d__%H_%M_%S-0400"
                caption_format: "%m/%d %H:%M %p"			  
    ```
4. Restart Home Assistant
5. Check the Panel appears in the sidebar

### Configuration Variables - Gallery Panel

A config entry of one or more tabs is required.  Each tab can be configured as follows

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| name | string | **Required** | The name of the tab at the top of the screen
| entity_id | string | **Required** | The entity_id of the files sensor added above
| maximum_files | string | **Optional** | The number of files to show in the gallery list.  You may want to limit videos to make it perform better and to conserve bandwith.  Used in combination with sort (using the config as above, the latest 10 by date will be shown)
| file_name_format | string | **Optional** | The format of the file names (see below).  Used in combination with caption_format for the captions below the image/video.
| caption_format | string | **Optional** | The format of the caption (see below).  Used in combination with file_name_format.

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
