(function($) {
  acf.fields.image_aspect_ratio_crop = acf.field.extend({
    type: 'image_aspect_ratio_crop',
    $el: null,
    $input: null,
    $img: null,

    actions: {
      ready: 'initialize',
      append: 'initialize',
    },

    events: {
      'click a[data-name="add"]': 'add',
      'click a[data-name="edit"]': 'edit',
      'click a[data-name="remove"]': 'remove',
      'change input[type="file"]': 'change',
      'click a[data-name="crop"]': 'changeCrop',
    },

    /*
        *  focus
        *
        *  This function will setup variables when focused on a field
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	n/a
        *  @return	n/a
        */

    focus: function() {
      // vars
      this.$el = this.$field.find('.acf-image-uploader-aspect-ratio-crop');
      this.$input = this.$el.find('input[type="hidden"]');
      this.$img = this.$el.find('img');

      // options
      this.o = acf.get_data(this.$el);
    },

    /*
        *  initialize
        *
        *  This function is used to setup basic upload form attributes
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	n/a
        *  @return	n/a
        */

    initialize: function() {
      var self = this;

      // add attribute to form
      if (this.o.uploader == 'basic') {
        this.$el.closest('form').attr('enctype', 'multipart/form-data');
      }

      $(document).on(
        'click',
        '.js-acf-image-aspect-ratio-crop-crop',
        function() {
          var cropData = self.cropper.getData(true);

          var data = {
            action: 'acf_image_aspect_ratio_crop_crop',
            data: JSON.stringify({
              id: $(this).data('id'),
              aspectRatioHeight: $(this).data('aspect-ratio-height'),
              aspectRatioWidth: $(this).data('aspect-ratio-width'),
              x: cropData.x,
              y: cropData.y,
              width: cropData.width,
              height: cropData.height,
            }),
          };

          $('.js-acf-image-aspect-ratio-crop-crop').prop('disabled', true);

          $.post(ajaxurl, data)
            .done(function(data) {
              self.cropComplete(data);
              $('.js-acf-image-aspect-ratio-crop-crop').prop('disabled', false);
            })
            .fail(function() {
              alert('Failed to crop image');
              $('.js-acf-image-aspect-ratio-crop-crop').prop('disabled', false);
            });
        }
      );
    },

    /*
        *  prepare
        *
        *  This function will prepare an object of attachment data
        *  selecting a library image vs embed an image via url return different data
        *  this function will keep the 2 consistent
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	attachment (object)
        *  @return	data (object)
        */

    prepare: function(attachment) {
      // defaults
      attachment = attachment || {};

      // bail ealry if already valid
      if (attachment._valid) return attachment;

      // vars
      var data = {
        url: '',
        alt: '',
        title: '',
        caption: '',
        description: '',
        width: 0,
        height: 0,
      };

      // wp image
      if (attachment.id) {
        // update data
        data = attachment.attributes;

        // maybe get preview size
        data.url = acf.maybe_get(
          data,
          'sizes.' + this.o.preview_size + '.url',
          data.url
        );
      }

      // valid
      data._valid = true;

      // return
      return data;
    },

    /*
        *  render
        *
        *  This function will render the UI
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	attachment (obj)
        *  @return	n/a
        */

    render: function(data) {
      console.log('redenr');

      console.log(data);

      // prepare
      data = this.prepare(data);

      // update image
      this.$img.attr({
        src: data.url,
        alt: data.alt,
        title: data.title,
      });

      // vars
      var val = '';

      // WP attachment
      if (data.id) {
        val = data.id;
      }

      // update val
      acf.val(this.$input, val);

      // update class
      if (val) {
        this.$el.addClass('has-value');
      } else {
        this.$el.removeClass('has-value');
      }
    },

    /*
        *  add
        *
        *  event listener
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	e (event)
        *  @return	n/a
        */

    add: function() {
      // reference
      var self = this,
        $field = this.$field;

      // get repeater
      var $repeater = acf.get_closest_field(this.$field, 'repeater');

      // popup
      var frame = acf.media.popup({
        title: acf._e('image', 'select'),
        mode: 'select',
        type: 'image',
        field: $field.data('key'),
        multiple: $repeater.exists(),
        library: this.o.library,
        mime_types: this.o.mime_types,

        select: function(attachment, i) {
          // select / add another image field?
          if (i > 0) {
            // vars
            var key = $field.data('key'),
              $tr = $field.closest('.acf-row');

            // reset field
            $field = false;

            // find next image field
            $tr.nextAll('.acf-row:visible').each(function() {
              // get next $field
              $field = acf.get_field(key, $(this));

              // bail early if $next was not found
              if (!$field) return;

              // bail early if next file uploader has value
              if (
                $field
                  .find('.acf-image-uploader-aspect-ratio-crop.has-value')
                  .exists()
              ) {
                $field = false;
                return;
              }

              // end loop if $next is found
              return false;
            });

            // add extra row if next is not found
            if (!$field) {
              $tr = acf.fields.repeater.doFocus($repeater).add();

              // bail early if no $tr (maximum rows hit)
              if (!$tr) return false;

              // get next $field
              $field = acf.get_field(key, $tr);
            }
          }

          console.log('selected', $field, attachment);

          self.openModal({ attachment: attachment, field: $field });

          // render
          self.set('$field', $field).render(attachment);
        },
      });
    },

    changeCrop: function() {
      var originalImageId = $(this.$field)
        .find('.acf-image-uploader-aspect-ratio-crop')
        .data('original-image-id');
      var attachment = new wp.media.model.Attachment.get(originalImageId);
      var self = this;
      attachment.fetch({
        success: function(response) {
          self.openModal({ attachment: response, field: self.$field });
        },
      });
    },

    /*
        *  edit
        *
        *  event listener
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	e (event)
        *  @return	n/a
        */

    edit: function() {
      // reference
      var self = this,
        $field = this.$field;

      // vars
      var val = this.$input.val();

      console.log('edit', val);

      // bail early if no val
      if (!val) return;

      // popup
      var frame = acf.media.popup({
        title: acf._e('image', 'edit'),
        button: acf._e('image', 'update'),
        mode: 'edit',
        attachment: val,

        select: function(attachment, i) {
          // render
          self.set('$field', $field).render(attachment);
        },
      });
    },

    /*
        *  remove
        *
        *  event listener
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	e (event)
        *  @return	n/a
        */

    remove: function() {
      // vars
      var attachment = {};

      // add file to field
      this.render(attachment);
    },

    /*
        *  change
        *
        *  This function will update the hidden input when selecting a basic file to add basic validation
        *
        *  @type	function
        *  @date	12/04/2016
        *  @since	5.3.8
        *
        *  @param	e (event)
        *  @return	n/a
        */

    change: function(e) {
      acf.fields.file.get_file_info(e.$el, this.$input);
    },

    openModal: function(data) {
      console.log('data', data.attachment);

      var url = data.attachment.attributes.url;
      var id = data.attachment.attributes.id;
      field = data.field;

      console.log('field', field);

      var aspectRatioWidth = $(field)
        .find('.acf-image-uploader-aspect-ratio-crop')
        .data('aspect_ratio_width');
      var aspectRatioHeight = $(field)
        .find('.acf-image-uploader-aspect-ratio-crop')
        .data('aspect_ratio_height');

      var options = {
        aspectRatio: aspectRatioWidth / aspectRatioHeight,
        viewMode: 1,
        autoCropArea: 1,
      };

      // prettier-ignore
      $('body').append(
        '<div class="acf-image-aspect-ratio-crop-backdrop">' +
        '<div class="acf-image-aspect-ratio-crop-modal-wrapper">' +
        '<div class="acf-image-aspect-ratio-crop-modal">' +
        '<div class="acf-image-aspect-ratio-crop-modal-heading">' +
        '<div class="acf-image-aspect-ratio-crop-modal-heading-text">Crop image</div>' +
        '<div class="acf-image-aspect-ratio-crop-modal-heading-close">' +
        '</div>' +
        '</div>' +
        '<div class="acf-image-aspect-ratio-crop-modal-image-container">' +
        '<img class="acf-image-aspect-ratio-crop-modal-image js-acf-image-aspect-ratio-crop-modal-image" src="' + url + '">' +
        '</div>' +
        '<div class="acf-image-aspect-ratio-crop-modal-footer">' +
        '<button class="button js-acf-image-aspect-ratio-crop-cancel">Cancel</button>' +
        '<button class="button button-primary js-acf-image-aspect-ratio-crop-crop" data-id="' + id + '" data-aspect-ratio-height="' + aspectRatioHeight + '" data-aspect-ratio-width="' + aspectRatioWidth +'">Crop</button>' +
        '</div>' +
        '</div>' +
        '</div>');

      this.cropper = new Cropper(
        $('.js-acf-image-aspect-ratio-crop-modal-image')[0],
        options
      );
    },

    cropComplete: function(data) {
      // Cropping successful, change image to cropped version

      $(field)
        .find('input')
        .val(data.id);

      var attachment = new wp.media.model.Attachment.get(data.id);

      var self = this;

      attachment.fetch({
        success: function(response) {
          self.render(response);
        },
      });
      this.closeModal();
    },

    closeModal: function() {
      $('.acf-image-aspect-ratio-crop-backdrop').remove();
    },
  });

  /**
   *  initialize_field
   *
   *  This function will initialize the $field.
   *
   *  @date	30/11/17
   *  @since	5.6.5
   *
   *  @param	n/a
   *  @return	n/a
   */

  function initialize_field($el) {
    //$field.doStuff();
    //var $field = $el, $options = $el.find('.acf-field-image-aspect-ratio-crop');
  }

  /*
		*  ready & append (ACF5)
		*
		*  These two events are called when a field element is ready for initizliation.
		*  - ready: on page load similar to $(document).ready()
		*  - append: on new DOM elements appended via repeater field or other AJAX calls
		*
		*  @param	n/a
		*  @return	n/a
		*/

  acf.add_action(
    'ready_field/type=image_aspect_ratio_crop',
    'initialize_field'
  );
  acf.add_action(
    'append_field/type=image_aspect_ratio_crop',
    'initialize_field'
  );
})(jQuery);
