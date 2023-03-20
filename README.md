# Gallery Card

Custom card for Home Assistant's UI LoveLace which will display images and videos in the style of a gallery.  Also supports displaying camera images.

This was developed for use alongside the [component for Kuna cameras](https://github.com/marthoc/kuna) but should work with any images/videos, in theory.

![Screenshot](https://github.com/TarheelGrad1998/GalleryCard/raw/master/screenshot.png)

## Images/Video sources
To display files from a folder, there are now three options when using v3.3+:
1. [The files component](https://github.com/TarheelGrad1998/files), a separate integration you must install and configure.
2. Using Local Media through a [media source](https://www.home-assistant.io/integrations/media_source/).  Set up the media source per hass and ensure it appears in the media browser.  NOTE:  DLNA sources not currently supported.
3. (new in v3.3) [The folder component](https://www.home-assistant.io/integrations/folder/), similar to the files component but included in Home Assistant by default.

#### Pros/Cons
At present, the decision of which to use is up to you, but there are consequences.  The files and folder components load the files from the server on the backend into a sensor.  This means when Lovelace loads it is much faster to access files.  However, you MUST store your files in the www directory, which means they are essentially publicly available to anyone who can access your HA URL.  The media source component only retrieves files when you load the page, which means it appears slower to load.  However, those files are protected by Home Assistant's authorization and not publicly available.  Additionally, media source files are currently only sorted by file name, where files has more options for date and file size.  

## Installation
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)

Now available in HACS, but follow the below to install manually.  For more details, see [Thomas Loven's Install Guide](https://github.com/thomasloven/hass-config/wiki/Lovelace-Plugins)

1.  Place the `gallery-card.js` file under your `/config/www/` folder of Home Assistant (suggest - create a subdirectory for `cards`)
2.  Add the card within the resources section (Config -> Lovelace Dashboards -> Resources)
    URL: /local/cards/gallery-card.js
    Type: Javascript Module
3.  Add the gallery card to your Lovelace configuration.  The below is an example config:
    ```
    type: 'custom:gallery-card'
    entities:
      - camera.front_door
      - sensor.gallery_images
      - 'media-source://media_source/videos/'
    menu_alignment: Responsive
    maximum_files: 10
    file_name_format: YYYYMMDD-HHmmss
    caption_format: M/D h:mm A 
    ```
I recommend adding the card to a view which is set to Panel Mode for best results.

### Configuration Variables 
Whether using the editor or yaml, the following configurations can be used:

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entities | string | **Required** | A list of entity_id of a files sensor, folder sensor, or camera entity, or the media source path (see below).  
| title | string | **Optional** | The name to show at the top of the card.  
| menu_alignment | string | **Optional** | Alignment of the menu (the small list of images/videos to view).  Default is if not specified is Responsive (see below)
| maximum_files | integer | **Optional** | The number of files to show.  You may want to limit videos to make it perform better and to conserve bandwith.  Used in combination with sort (using the config as above, the latest 10 for each entity by date will be shown)
| maximum_files_per_entity | boolean | **Optional** | Whether the number of files counted are per Entity.  If true, then the maximum files displayed will be up to maximum_files per entity ; if false then only maximum_files total will be displayed (camera entities are always included and count as 1 file).  The default is true.
| file_name_format | string | **Optional** | The format of the file names (see below).  Used in combination with caption_format for the captions below the image/video.  As of v3.4, this may also be specified at the entity level to override this for a specific entity.
| file_name_date_begins | integer | **Optional** | The character at which the date begins in the file name (starting at 1).  It is usually not necessary to specify this, but if your dates are not parsing correctly and there are numbers at the start of your file names try this.  This may also be specified at the entity level to override this for a specific entity.
| caption_format | string | **Optional** | The format of the caption (see below).  Used in combination with file_name_format. As of v3.4, this may also be specified at the entity level to override this for a specific entity.
| folder_format | string | **Optional** | The format of the subfolder names under any media source folders (same options as for Captions below).  Used when reverse_sort is true and maximum_files is specified to more efficiently fetch files from the media source (rather than looking in all folders). This may also be specified at the entity level to override this for a specific entity.
| slideshow_timer | integer | **Optional** | If present and greater than 0, will automatically advance the gallery after the provided number of seconds have passed.
| show_duration | boolean | **Optional** | Whether to include the video duration as part of the caption.  The default is true.
| video_autoplay | boolean | **Optional** | Enables the autoplay attribute for the main video in the gallery.  The default is false.
| video_loop | boolean | **Optional** | Enables the loop attribute for the main video in the gallery.  The default is false.
| video_muted | boolean | **Optional** | Mutes all videos in the gallery.  The default is false.
| parsed_date_sort | boolean | **Optional** | Whether to use the date parsed using file_name_format in order to sort the items.  Use this to ensure sorting by date if the source is not properly sorted.  The default is false.
| reverse_sort | boolean | **Optional** | Whether to sort the items with the newest first.  The default is true.
| random_sort | boolean | **Optional** | Whether to sort the items randomly.  The default is false.
| show_reload | boolean | **Optional** | Shows a reload link to allow manually triggering a reload of images/videos.  The default is false.

### Media Source
To add a media source, specify the path to the media source folder as an entity.  
The format of a media source path should be:  media-source://media_source/{your folders}/
Only Local Media sources are currently supported (i.e. not DLNA sources)

Additionally, media source entities can have the following additional options:
| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| include_images | boolean | **Optional** | Whether to include image files from the folder.  The default is true.  
| include_video | boolean | **Optional** | Whether to include video files from the folder.  The default is true. 
| recursive | boolean | **Optional** | Whether to load files only under this folder (the default, false) or from any subfolder under the folder specified.  Ignored when folder_format is specified.
| folder_format | string | **Optional** | The format of the subfolder names under the media source folder (same options as for Captions below).  Used when reverse_sort is true and maximum_files is specified to more efficiently fetch files from the media source (rather than looking in all folders).  

Examples:

    ```
    entities:
      - path: 'media-source://media_source/surveillance/Carport/'
        recursive: true 
	include_images: false
    ```

    ```
    entities:
      - path: 'media-source://media_source/surveillance/Carport/'
        folder_format: YYYYMMDDA
	include_video: false
    ```

Use caution if your folders are very deep (lots of subfolders) or wide (lots of folders/files) as you could overload the Home Assistant web service.  If your UI loops between "Connection Lost" and reloading the page, try removing the recursive option or using a more direct folder path.

### Menu Alignment
Available options for Menu Alignment are below:

| Value | Description
| ----------- | -----------
| Responsive | On wider views (e.g. landscape >= 600px) uses the Right alignment, on narrower views (e.g. portrait < 600px) the Bottom
| Left | Always shows a vertical list on the left of the card.
| Right | Always shows a vertical list on the right of the card (shown in the image above).
| Top | Always shows a horizontal list on the top of the card.
| Botom | Always shows a vertical list on the bottom of the card.
| Hidden | Hides the list and only shows the larger image

### Caption Configuration
The captions under the image/video is formatted using file_name_format and caption_format.  If either file_name_format or caption_format is ommitted, the raw filename is used.

The assumption is that the file name contains the date formatted such that it can be parsed and formatted for easier human consumption.  As of v3.4, the day.js library is used for parsing and formatting dates.
* [Available options for file_name_format](https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens)
* [Available options for caption_format as well as folder_format](https://day.js.org/docs/en/display/format#list-of-all-available-formats)

Example:
* file_name_format: YYYY_MM_DD__HH_mm_ss
	* Assumes the file name is in the format 2023_03_17__20_00_00
* caption_format: M/D h:mm A	
	* Will parse the file name and return a date formatted as 3/17 8:00 PM

Notes:
* You may use a value of "AGO" for caption_format to display the elapsed time since the file date (e.g. "an hour ago").  [More information here](https://day.js.org/docs/en/display/from-now)
* To mix AGO with a date format, ensure AGO is within brackets.  E.g. "[AGO on] dddd" will result in "an hour ago on Saturday"
* You may also use a space (caption_format: " ") to leave the captions blank.
* As of v3.4, you no longer need to specify any extranous characters in file_name_format.  The day.js library is capable of "finding" the proper date in the file name.

## Credits

The files component largely taken from work done by @zsarnett in [the slideshow card](https://github.com/zsarnett/slideshow-card), from which other inspiration was also taken.  
