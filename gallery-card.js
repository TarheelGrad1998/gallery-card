var GalleryCardVersion="3.5.1";

import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

import "https://unpkg.com/dayjs@1.11.7/dayjs.min.js?module";
import "https://unpkg.com/dayjs@1.11.7/plugin/customParseFormat.js?module";
import "https://unpkg.com/dayjs@1.11.7/plugin/relativeTime.js?module";

class GalleryCard extends LitElement {
  static get properties() {
    return {
      _hass: {},
      config: {},
      resources: {},
      currentResourceIndex: {},
      selectedDate: {}
    };
  }

  render() {    
    const menuAlignment = (this.config.menu_alignment || "responsive").toLowerCase();
    
    return html`
        ${this.errors == undefined ? html`` :
         this.errors.map((error) => {
          return html`<hui-warning>${error}</hui-warning>`
         })}
        <ha-card .header=${this.config.title} class="menu-${menuAlignment}">
          ${this.currentResourceIndex == undefined || !(this.config.enable_date_search ?? false) ?
            html`` : html`<input type="date" class="date-picker" @change="${this._handleDateChange}" value="${this._formatDateForInput(this.selectedDate)}">` }
          ${this.currentResourceIndex == undefined || !(this.config.show_reload ?? false) ?
            html`` : html`<ha-progress-button class="btn-reload" @click="${ev => this._loadResources(this._hass)}">Reload</ha-progress-button>` }
          <div class="resource-viewer" @touchstart="${ev => this._handleTouchStart(ev)}" @touchmove="${ev => this._handleTouchMove(ev)}">
            <figure style="margin:5px;">
              ${
                this._currentResource().isHass ?
                html`<hui-image @click="${ev => this._popupCamera(ev)}"
                    .hass=${this._hass}
                    .cameraImage=${this._currentResource().name}
                    .cameraView=${"live"}
                  ></hui-image>` :
                this._isImageExtension(this._currentResource().extension) ?
                html`<img @click="${ev => this._popupImage(ev)}" src="${this._currentResource().url}"/>` :
                html`<video controls ?loop=${this.config.video_loop} ?autoplay=${this.config.video_autoplay} src="${this._currentResource().url}#t=0.1" @loadedmetadata="${ev => this._videoMetadataLoaded(ev)}" @canplay="${ev => this._startVideo(ev)}"  preload="metadata"></video>`
              }
              <figcaption>${this._currentResource().caption} 
                ${this._isImageExtension(this._currentResource().extension) ?
                  html`` : html`<span class="duration"></span> ` }                  
                ${!(this.config.show_zoom ?? false) ?
                  html`` : html`<a href= "${this._currentResource().url}" target="_blank">Zoom</a>` }                  
              </figcaption>
            </figure>  
            <button class="btn btn-left" @click="${ev => this._selectResource(this.currentResourceIndex-1)}">&lt;</button> 
            <button class="btn btn-right" @click="${ev => this._selectResource(this.currentResourceIndex+1)}">&gt;</button> 
          </div>
          <div class="resource-menu">
            ${this.resources.map((resource, index) => {
                return html`
                    <figure style="margin:5px;" id="resource${index}" data-imageIndex="${index}" @click="${ev => this._selectResource(index)}" class="${(index == this.currentResourceIndex) ? 'selected' : ''}">
                    ${
                      resource.isHass ?
                      html`<hui-image
                          .hass=${this._hass}
                          .cameraImage=${resource.name}
                          .cameraView=${"live"}
                        ></hui-image>` :
                      this._isImageExtension(resource.extension) ?
                      html`<img class="lzy_img" src="/local/community/gallery-card/placeholder.jpg" data-src="${resource.url}"/>` :
                        (this.config.video_preload ?? true) ?
                        html`<video preload="none" data-src="${resource.url}#t=${(this.config.preview_video_at == null) ? 0.1 : this.config.preview_video_at }" @loadedmetadata="${ev => this._videoMetadataLoaded(ev)}" @canplay="${ev => this._downloadNextMenuVideo()}" preload="metadata"></video>` :
                          html`<center><div class="lzy_img"><ha-icon id="play" icon="mdi:movie-play-outline"></ha-icon></div></center>`
                    }
                    <figcaption>${resource.caption} <span class="duration"></span></figcaption>
                    </figure>
                `;
            })}
          </div>
          <div id="imageModal" class="modal" @touchstart="${ev => this._handleTouchStart(ev)}" @touchmove="${ev => this._handleTouchMove(ev)}">
            <img class="modal-content" id="popupImage">
            <div id="popupCaption"></div>
          </div>
        </ha-card>
    `;
  }
 
  _downloadingVideos = false;
  updated(changedProperties) {
    const arr = this.shadowRoot.querySelectorAll('img.lzy_img')
    arr.forEach((v) => {
        this.imageObserver.observe(v);
    })
    const varr = this.shadowRoot.querySelectorAll('video.lzy_video')
    varr.forEach((v) => {
        this.imageObserver.observe(v);
    })
    // changedProperties.forEach((oldValue, propName) => {
    //   console.log(`${propName} changed. oldValue: ${oldValue}`);
    // });
    
    if (!this._downloadingVideos) 
      this._downloadNextMenuVideo();
  }

  async _downloadNextMenuVideo() {
    this._downloadingVideos = true;
    let v = this.shadowRoot.querySelector(".resource-menu figure video[data-src]");
    
    if (v)
    {
      await new Promise(r => setTimeout(r, 100));
      var src = v.dataset.src;
      v.removeAttribute("data-src");
      v.src = src;      
      v.load();
    }
    else {
      this._downloadingVideos = false;
    }
  }

  setConfig(config) {
    dayjs.extend(dayjs_plugin_customParseFormat);
    dayjs.extend(dayjs_plugin_relativeTime);

    this.imageObserver = new IntersectionObserver((entries, imgObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target
                //console.log("lazy loading ", lazyImage)
                lazyImage.src = lazyImage.dataset.src
            }
        })
    });
    if (!config.entity && !config.entities) {
      throw new Error("Required configuration for entities is missing");
    }

    this.config = config;
    if (this.config.entity) {
      if (!this.config.entities) {
        this.config = { ...this.config, entities: [] };
      }
      this.config.entities.push(this.config.entity);
      delete this.config.entity;
    }

    if (this._hass !== undefined)
      this._loadResources(this._hass);

    this._doSlideShow(true);
  }

  set hass(hass) {
    this._hass = hass;
    
    if (this.resources == null)
      this._loadResources(this._hass);
  }

  getCardSize() {
    return 1;
  }

  _isImageExtension(ext) {
    return(ext.match(/(jpeg|jpg|gif|png|tiff|bmp)$/) != null);
  }

  _doSlideShow(firstTime) {
    if (!firstTime)
      this._selectResource(this.currentResourceIndex+1, true);

    if (this.config.slideshow_timer) {
      var time = parseInt(this.config.slideshow_timer);
      if (!isNaN(time) && time > 0) {
        setTimeout(() => {this._doSlideShow();}, (time * 1000));
      }
    }
  }

  _selectResource(idx, fromSlideshow) {
    this.autoPlayVideo = true;

    var nextResourceIdx = idx;

    if (idx < 0)
      nextResourceIdx = this.resources.length - 1;
    else if (idx >= this.resources.length)
      nextResourceIdx = 0;

    this.currentResourceIndex = nextResourceIdx;
    this._loadImageForPopup();

    if (fromSlideshow && this.parentNode && this.parentNode.tagName && this.parentNode.tagName.toLowerCase() == "hui-card-preview") {
      return;
    }

    var elt = this.shadowRoot.querySelector("#resource" + this.currentResourceIndex);
    if (elt)
      elt.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
  }

  _getResource(index) {
    if (this.resources !== undefined && index !== undefined && this.resources.length > 0) {
      return this.resources[index];
    }
    else {
      return {
        url: "",
        name: "",
        extension: "jpg",
        caption: index === undefined ? "Loading resources..." : "No images or videos to display",
        index: 0
      };
    }
  }

  _currentResource() {
    return this._getResource(this.currentResourceIndex);
  }

  _startVideo(evt) {
  	if (this.autoPlayVideo)
  		evt.target.play();
  }

  _videoMetadataLoaded(evt) {
    var showDuration = this.config.show_duration ?? true;
    if (!isNaN(parseInt(evt.target.duration)) && showDuration)
      evt.target.parentNode.querySelector(".duration").innerHTML = "[" + this._getFormattedVideoDuration(evt.target.duration) + "]";    

    if (this.config.video_muted)
      evt.target.muted = "muted";
  }

  _popupCamera(evt) {
    const event = new Event("hass-more-info", {
      bubbles: true,
      composed: true
    });
    event.detail = {entityId: this._currentResource().name};
    this.dispatchEvent(event);
  }

  _popupImage(evt) {
    var modal = this.shadowRoot.getElementById("imageModal");    
    modal.style.display = "block";
    this._loadImageForPopup();
    modal.scrollIntoView(true);

    modal.onclick = function() {
      modal.style.display = "none";
    }
  }

  _loadImageForPopup() {
    var modal = this.shadowRoot.getElementById("imageModal");
    var modalImg = this.shadowRoot.getElementById("popupImage");
    var captionText = this.shadowRoot.getElementById("popupCaption");

    if (modal.style.display == "block") {
      modalImg.src = this._currentResource().url;
      captionText.innerHTML = this._currentResource().caption;
    }
  }

  _getFormattedVideoDuration(duration) {
  	var minutes = parseInt(duration / 60);
    if (minutes < 10)
      minutes = "0" + minutes;

    var seconds = parseInt(duration % 60);
    seconds = "0" + seconds;
    seconds = seconds.substring(seconds.length - 2);
    
    return minutes + ":" + seconds;    
  }  
  
  _keyNavigation(evt) {
    switch(evt.code) {
      case "ArrowDown":
      case "ArrowRight":
        this._selectResource(this.currentResourceIndex+1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        this._selectResource(this.currentResourceIndex-1);
        break;
      default:
        // null
    }
  }

  _handleTouchStart(evt) {                                         
      this.xDown = evt.touches[0].clientX;                                      
      this.yDown = evt.touches[0].clientY;                                      
  }; 
  
  _handleTouchMove(evt) {
      if ( ! this.xDown || ! this.yDown ) {
          return;
      }
      var xUp = evt.touches[0].clientX;                                    
      var yUp = evt.touches[0].clientY;
      var xDiff = this.xDown - xUp;
      var yDiff = this.yDown - yUp;
  
      if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
          if ( xDiff > 0 ) {
          /* left swipe */ 
          this._selectResource(this.currentResourceIndex+1);
          evt.preventDefault();
          } else {
          /* right swipe */
          this._selectResource(this.currentResourceIndex-1);
          evt.preventDefault();
          }                       
      } else {
          if ( yDiff > 0 ) {
          /* up swipe */ 
          } else { 
          /* down swipe */
          }                                                                 
      }
      /* reset values */
      this.xDown = null;
      this.yDown = null;                                            
  };
  
  _handleDateChange(event) {
    this.selectedDate = event.target.valueAsDate;
    this._loadResources(this._hass);
  };

  _loadResources(hass) {
    var commands = [];

    this.currentResourceIndex = undefined;
    this.resources = [];
    if(this.selectedDate==null)
        this.selectedDate = new Date();

    const maximumFilesPerEntity = this.config.maximum_files_per_entity ?? true;
    const maximumFiles = maximumFilesPerEntity ? this.config.maximum_files : undefined;
    const maximumFilesTotal = maximumFilesPerEntity ? undefined: this.config.maximum_files;
    var folderFormat = this.config.folder_format;
    var fileNameFormat = this.config.file_name_format;
    var fileNameDateBegins = this.config.file_name_date_begins;
    var captionFormat = this.config.caption_format;    
    const parsedDateSort = this.config.parsed_date_sort ?? false;
    const reverseSort = this.config.reverse_sort ?? true;
    const randomSort = this.config.random_sort ?? false;
    var filterForDate = this.config.enable_date_search ?? false;

    this.config.entities.forEach(entity => {
      var entityId;
      var recursive = false;      
      var includeVideo = true;
      var includeImages = true;
      if (typeof entity === 'object') {
        entityId = entity.path;
        if (entity.recursive)
          recursive = entity.recursive;
        if (entity.include_video != undefined)
          includeVideo = entity.include_video;          
        if (entity.include_images != undefined)
          includeImages = entity.include_images;          
        if (entity.folder_format)
          folderFormat = entity.folder_format;
        if (entity.file_name_format)
          fileNameFormat = entity.file_name_format;
        if (entity.file_name_date_begins)
          fileNameDateBegins = entity.file_name_date_begins;
        if (entity.caption_format)
          captionFormat = entity.caption_format;          
      }
      else {
        entityId = entity;
      }

      if (entityId.substring(0, 15).toLowerCase() == "media-source://") {
        commands.push(this._loadMediaResource(hass, entityId, maximumFiles, folderFormat, fileNameFormat, fileNameDateBegins, captionFormat, recursive, reverseSort, includeVideo, includeImages, filterForDate));
      }
      else {
        var entityState = hass.states[entityId];

        if (entityState == undefined) {
          commands.push(Promise.resolve({
            error: true,
            entity: entityId,
            message: "Invalid Entity ID"
          }));
        }
        else {
          if (entityState.attributes.entity_picture != undefined)
            commands.push(this._loadCameraResource(entityId, entityState));

          //Custom Files component
          if (entityState.attributes.fileList != undefined)
            commands.push(this._loadFilesResources(entityState.attributes.fileList, maximumFiles, fileNameFormat, fileNameDateBegins, captionFormat, reverseSort));

          //HA Folder component
          if (entityState.attributes.file_list != undefined)
            commands.push(this._loadFilesResources(entityState.attributes.file_list, maximumFiles, fileNameFormat, fileNameDateBegins, captionFormat, reverseSort));
        }
      }
    });

    Promise.all(commands).then(resources => {
      this.resources = resources.filter(result => !result.error).flat(Infinity);

      if (parsedDateSort) {        
        if (reverseSort) {
          this.resources.sort(function (x, y) { return y.date - x.date; });
        }
        else {
          this.resources.sort(function (x, y) { return x.date - y.date; });
        }
      }

      if (randomSort) {
        for(var i = this.resources.length - 1; i > 0; i--) {
          var r = Math.floor(Math.random() * (i + 1) );
          if(i != r) {
            [this.resources[i], this.resources[r]] = [this.resources[r], this.resources[i]];
          }
        }
      }

      if (maximumFilesTotal != undefined && !isNaN(maximumFilesTotal) && maximumFilesTotal < this.resources.length) {
        //Keep only N total, but make sure camera resources remain
        this.resources = this.resources.filter(function(resource) {
          if (resource.isHass)
            return true;
          else if (this.count < maximumFilesTotal) {
            this.count++;
            return true;
          }
          else {
            return false;
          }
        }, {count: resources.filter(resource => resource.isHass).length});
      }

      this.currentResourceIndex = 0; 
      if (!(this.parentNode && this.parentNode.tagName && this.parentNode.tagName.toLowerCase() == "hui-card-preview")) {
        document.addEventListener('keydown',ev=>this._keyNavigation(ev));
      }

      this.errors = [];
      resources.filter(result => result.error).flat(Infinity).forEach(error => {
        this.errors.push(error.message + ' ' + error.entity)
        this._hass.callService('system_log', 'write', {
          message: 'Gallery Card Error:  ' + error.message + '   ' + error.entity
        });
      });
    });
  }

  _loadMediaResource(hass, contentId, maximumFiles, folderFormat, fileNameFormat, fileNameDateBegins, captionFormat, recursive, reverseSort, includeVideo, includeImages, filterForDate) {
    return new Promise(async (resolve, reject) => {    
      var mediaPath = contentId;
      try {
        var values = [];

        if (folderFormat && reverseSort && maximumFiles != undefined && !isNaN(maximumFiles)) {  //Can do more targeted folder searching under these conditions
          var date = dayjs();
          var folderPrev = "";
          var failedPaths = [];

          while (values.length < maximumFiles) {  
            var folder = date.format(folderFormat);
            mediaPath = contentId + "/" + folder;

            if (folder != folderPrev) {
              try {
                var folderValues = await this._loadMedia(this, hass, mediaPath, maximumFiles, false, reverseSort, includeVideo, includeImages, filterForDate);
                values.push(...folderValues);
              }
              catch(e) {
                if (e.code == 'browse_media_failed') 
                  failedPaths.push(mediaPath);
                else
                  throw e;
              }              
            }

            if (failedPaths.length > 2) {
              if (values.length == 0) {
                mediaPath = failedPaths.join();
                throw {message: 'Failed to browse several folders and found no media files.  Verify your settings are correct.'};
              }
              break;
            }

            folderPrev = folder;
            date = date.subtract(12, 'hour');  //Allows for AM/PM folders
          }

          if (values.length > maximumFiles)
            values.length = maximumFiles;
        }
        else 
          values = await this._loadMedia(this, hass, mediaPath, maximumFiles, recursive, reverseSort, includeVideo, includeImages, filterForDate);        
        
        var resources = [];
        values.forEach(mediaItem => {
          var resource = this._createFileResource(mediaItem.authenticated_path, fileNameFormat, fileNameDateBegins, captionFormat);

          if (resource !== undefined) {
            resources.push(resource);
          }
        });   
        resolve(resources);
      }     
      catch(e) {
        console.log(e);
        resolve({
          error: true,
          entity: mediaPath,
          message: e.message
        });
      }
      
    });
  }

  _loadMedia(ref, hass, contentId, maximumFiles, recursive, reverseSort, includeVideo, includeImages, filterForDate) {
    var mediaItem = {
      media_class: "directory",
      media_content_id: contentId
    };

    if (contentId.substring(contentId.length - 1, contentId.length) != "/" && contentId != "media-source://media_source") {
      mediaItem.media_content_id += "/";
    }

    return Promise.all(this._fetchMedia(ref, hass, mediaItem, recursive, includeVideo, includeImages, filterForDate))
      .then(function(values) { 
        var mediaItems = values
          .flat(Infinity)
          .filter(function(item) {return item !== undefined})
          .sort(
            function (a, b) {
              if (a.title > b.title) {
                return 1;
              }
              if (a.title < b.title) {
                return -1;
              }
            return 0;
          });

        if (reverseSort)
          mediaItems.reverse();
          
        if (maximumFiles != undefined && !isNaN(maximumFiles) && maximumFiles < mediaItems.length) {
          mediaItems.length = maximumFiles;
        }        

        return Promise.all(mediaItems.map(function(mediaItem) {
          return ref._fetchMediaItem(hass, mediaItem.media_content_id)
            .then(function(auth) {
              return {
                ...mediaItem,
                authenticated_path: auth.url 
              };
            });
        }));
      });
  }

  _fetchMedia(ref, hass, mediaItem, recursive, includeVideo, includeImages, filterForDate) {
    var commands = [];

    if (mediaItem.media_class == "directory") {
      if (mediaItem.children) {
        commands.push(
          ...mediaItem.children
          .filter(mediaItem => { 
            return ((includeVideo && mediaItem.media_class == "video") || (includeImages && mediaItem.media_class == "image") || (recursive && mediaItem.media_class == "directory" && (!filterForDate || (mediaItem.title ==  ref._folderDateFormatter((ref.config.search_date_folder_format == null)?"DD_MM_YYYY":ref.config.search_date_folder_format,ref.selectedDate) ) ))) && mediaItem.title != "@eaDir/";
          })
          .map(mediaItem => {
            return Promise.all(ref._fetchMedia(ref, hass, mediaItem, recursive, includeVideo, includeImages, filterForDate));
          }));
      }
      else {
        commands.push(
          ref._fetchMediaContents(hass, mediaItem.media_content_id)
          .then(mediaItem => {
            return Promise.all(ref._fetchMedia(ref, hass, mediaItem, recursive, includeVideo, includeImages, filterForDate));
          })
        );
      }
    }

    if (mediaItem.media_class != "directory") {
      commands.push(Promise.resolve(mediaItem));
    }

    return commands;
  }

  _fetchMediaContents(hass, contentId) {
    return hass.callWS({
      type: "media_source/browse_media",
      media_content_id: contentId
    })
  }

  _fetchMediaItem(hass, mediaItemPath) {
    return hass.callWS({
      type: "media_source/resolve_media",
      media_content_id: mediaItemPath,
      expires: (60 * 60 * 3)  //3 hours
    })
  }

  _loadCameraResource(entityId, camera) {
    var resource = {
      url: camera.attributes.entity_picture,
      name: entityId,
      extension: "jpg",
      caption: camera.attributes.friendly_name ?? entityId,
      isHass: true
    }
  
    return Promise.resolve(resource);
  }

  _loadFilesResources(files, maximumFiles, fileNameFormat, fileNameDateBegins, captionFormat, reverseSort) {
    var resources = [];
    if (files) {
      files = files.filter(file => file.indexOf("@eaDir") < 0);

      if (reverseSort)
        files.reverse();

      if (maximumFiles != undefined && !isNaN(maximumFiles) && maximumFiles < files.length) {
        files.length = maximumFiles;
      }

      files.forEach(file => {
        var filePath = file;
        // /config/downloads/front_door/
        // /config/www/...
        var fileUrl = filePath.replace("/config/www/", "/local/");
        if (filePath.indexOf("/config/www/") < 0)
          fileUrl = "/local/" + filePath.substring(filePath.indexOf("/www/")+5);

        var resource = this._createFileResource(fileUrl, fileNameFormat, fileNameDateBegins, captionFormat);
        
        if (resource !== undefined) {
          resources.push(resource);
        }
      });
    }

    return Promise.resolve(resources);
  }

  _createFileResource(fileRawUrl, fileNameFormat, fileNameDateBegins, captionFormat) {
    var resource;

    var fileUrl = fileRawUrl.split("?")[0];
    var arfilePath = fileUrl.split("/");
    var fileName = arfilePath[arfilePath.length - 1];
    var date = "";
    var fileCaption = "";

    if (fileName != '@eaDir') {
      var arFileName = fileName.split(".");
      var ext = arFileName[arFileName.length - 1].toLowerCase();
      fileName = fileName.substring(0, fileName.length - ext.length - 1);
      fileName = decodeURIComponent(fileName);

      if (captionFormat != " ")
        fileCaption = fileName;
      
      var fileDatePart = fileName;
      if (fileNameDateBegins && !isNaN(parseInt(fileNameDateBegins)))
        fileDatePart = fileDatePart.substring(parseInt(fileNameDateBegins) - 1);
      console.log(fileDatePart);
      if (fileNameFormat)
        date = dayjs(fileDatePart, fileNameFormat);

      if (date && captionFormat) {
        if (captionFormat.toUpperCase().trim() == 'AGO')
          fileCaption = date.fromNow();
        else {
          fileCaption = date.format(captionFormat);
          fileCaption = fileCaption.replace(/ago/ig, date.fromNow());
        }
      }

      resource = {
        url: fileRawUrl,
        base_url: fileUrl,
        name: fileName,
        extension: ext,
        caption: fileCaption,
        index: -1,
        date: date
      };
    }

    return resource;
  }
  
  _folderDateFormatter(folderFormat, date ) {
    return dayjs(date).format(folderFormat);
  }
  
  _formatDateForInput(date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
  }
 

  static get styles() {
    return css`
      .content {
        overflow: hidden;
      }
      .content hui-card-preview {
        max-width: 100%;
      }
      ha-card {
        height: 100%;
        overflow: hidden;
      }
      .btn-reload {
        float: right;
        margin-right: 25px;
        text-align: right;
      }
      .date-picker {
        padding-left: 5px;
        margin-left: 5px;
        margin-top: 8px;
      }
      figcaption {
        text-align:center;
        white-space: nowrap;
      }
      img, video {
        width: 100%;
        object-fit: contain;
      }
      .resource-viewer .btn {
        position: absolute;
        transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        background-color: #555;
        color: white;
        font-size: 16px;
        padding: 12px 12px;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        opacity: 0;
        transition: opacity .35s ease;
      }
      .resource-viewer:hover .btn {
        opacity: 1;
      }
      .resource-viewer .btn-left {
        left: 0%;
        margin-left: 25px;
      }
      .resource-viewer .btn-right {
        right: 0%;
        margin-right: -10px
      }
      figure.selected {
        opacity: 0.5;
      }
      .duration {
        font-style:italic;
      }
      @media all and (max-width: 599px) {
        .menu-responsive .resource-viewer {
          width: 100%;
        }
        .menu-responsive .resource-viewer .btn {
          top: 33%;
        }
        .menu-responsive .resource-menu {
          width:100%; 
          overflow-y: hidden;
          overflow-x: scroll;
          display: flex;
        }
        .menu-responsive .resource-menu figure {
          margin: 0px;
          padding: 12px;
        }
      }
      @media all and (min-width: 600px) {
        .menu-responsive .resource-viewer {
          float: left;
          width: 75%;
          position: relative;
        }
        .menu-responsive .resource-viewer .btn {
          top: 40%;
        }
                
        .menu-responsive .resource-menu {
          width:25%; 
          height: calc(100vh - 120px);
          overflow-y: scroll; 
          float: right;
        }
      }
      .menu-bottom .resource-viewer {
        width: 100%;
      }
      .menu-bottom .resource-viewer .btn {
        top: 33%;
      }
      .menu-bottom .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: flex;
      }
      .menu-bottom .resource-menu figure {
        margin: 0px;
        padding: 12px;
        width: 25%;
      }
      .menu-bottom .resource-viewer figure img,
      .menu-bottom .resource-viewer figure video {
        max-height: 70vh;
      }
      .menu-right .resource-viewer {
        float: left;
        width: 75%;
        position: relative;
      }
      .menu-right .resource-viewer .btn {
        top: 40%;
      }
              
      .menu-right .resource-menu {
        width:25%; 
        height: calc(100vh - 120px);
        overflow-y: scroll; 
        float: right;
      }
      .menu-left .resource-viewer {
        float: right;
        width: 75%;
        position: relative;
      }
      .menu-left .resource-viewer .btn {
        top: 40%;
      }
              
      .menu-left .resource-menu {
        width:25%; 
        height: calc(100vh - 120px);
        overflow-y: scroll; 
        float: left;
      }
      .menu-left .btn-reload {
        float: left;
        margin-left: 25px;
      }
      .menu-top {
        display: flex;
        flex-direction: column;
      }
      .menu-top .resource-viewer {
        width: 100%;
        order: 2
      }
      .menu-top .resource-viewer .btn {
        top: 45%;
      }
      .menu-top .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: flex;
        order: 1
      }
      .menu-top .resource-menu figure {
        margin: 0px;
        padding: 12px;
        width: 25%;
      }
      .menu-top .resource-viewer figure img,
      .menu-top .resource-viewer figure video {
        max-height: 70vh;
      }
      .menu-hidden .resource-viewer {
        width: 100%;
      }
      .menu-hidden .resource-viewer .btn {
        top: 33%;
      }
      .menu-hidden .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: none;
      }
      /* The Modal (background) */
      .modal {
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 1; /* Sit on top */
        padding-top: 100px; /* Location of the box */
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgb(0,0,0); /* Fallback color */
        background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
      }
      /* Modal Content (Image) */
      .modal-content {
        margin: auto;
        display: block;
        width: 95%;
      }
      /* Caption of Modal Image (Image Text) - Same Width as the Image */
      #popupCaption {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
        text-align: center;
        color: #ccc;
        padding: 10px 0;
        height: 150px;
      }
      /* Add Animation - Zoom in the Modal */
      .modal-content, #popupCaption {
        animation-name: zoom;
        animation-duration: 0.6s;
      }
      @keyframes zoom {
        from {transform:scale(0)}
        to {transform:scale(1)}
      }
      /* 100% Image Width on Smaller Screens */
      @media only screen and (max-width: 700px){
        .modal-content {
          width: 100%;
        }
      }
    `;
  }
}
customElements.define("gallery-card", GalleryCard);

console.groupCollapsed(`%cGALLERY-CARD ${GalleryCardVersion} IS INSTALLED`,"color: green; font-weight: bold");
console.log("Readme:","https://github.com/TarheelGrad1998/gallery-card");
console.groupEnd();

window.customCards = window.customCards || [];
window.customCards.push({
  type: "gallery-card",
  name: "Gallery Card",
  preview: false, // Optional - defaults to false
  description: "The Gallery Card allows for viewing multiple images/videos.  Requires the Files sensor availble at https://github.com/TarheelGrad1998" // Optional
});
