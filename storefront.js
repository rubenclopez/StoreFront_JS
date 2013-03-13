var StorefrontSeedForm = {

    hiddenAssetFields:         undefined,
    additionalAssetsContainer: undefined,
    additionalFileField:       undefined, 
    addButton:                 undefined,
    thumbnailSkeleton:         undefined,
    
    init: function() {

        // TODO: Make sure that we pass context 
        this.additionalMassFileFields  = jQuery('.js-sf-mass-file-fields');
        this.additionalFileField       = jQuery('#js-sf-additional-file');
        this.additionalVideoField      = jQuery('#js-sf-additional-video')
        this.additionalAssetsContainer = jQuery('#js-sf-additionals-asset .assets-container');
        this.videoAssetsContainer      = jQuery('#js-sf-videos-assets .assets-container');
        this.hiddenAssetFields         = jQuery('#js-sf-assets-hidden-fields');
        this.addButton                 = jQuery('#js-sf-image-update-button');
        this.additionalAddButton       = jQuery('#js-sf-additional-add-button');
        this.videoAddButton            = jQuery('#js-sf-video-add-button');

        this.mainForm                  = jQuery('#js-sf-main-form');
        this.responseFrame             = jQuery('#js-sf-response-frame');

        this.storefrontSeedID          = jQuery('#id', this.mainForm).val(); 
        this.removeButtons             = jQuery('.delete-asset', this.mainForm);

        this.assetContainers           = jQuery('.uploaded-images', this.mainForm);
        this.thumbnailSkeleton         = jQuery('.thumbnail-container', '#thumbnail-skeleton');
        
        this.createStorefrontButton    = jQuery('#js-sf-create-storefront-button');
        this.saveStorefrontButton      = jQuery('#js-sf-save-storefront');

        this.additionalAddButton.click( function( e ) {
            StorefrontSeedForm.additionalAddButton.removeClass('icon-add').addClass('searching-spinner');
            StorefrontSeedForm.mainForm.submit();
        });

        this.createStorefrontButton.click( function(e) {
            if (confirm("Are you sure you're ready to submit this Storefront? This can't be undone.")) {
                StorefrontSeedForm.mainForm.append(
                    '<input type="hidden" name="data[form_submitted]" value="true">'
                );
                StorefrontSeedForm.mainForm.submit();
            }
        });
        this.saveStorefrontButton.click( function(e) {
            StorefrontSeedForm.mainForm.submit();
        });

        this.videoAddButton.click( function( e ) {
            StorefrontSeedForm.videoAddButton.removeClass('icon-add').addClass('searching-spinner');
            StorefrontSeedForm.mainForm.submit();
        });

        this.responseFrame.load( function( e ) {
            var responseData    = StorefrontSeedForm.responseFrame.contents().find('pre').html() ||
                                    StorefrontSeedForm.responseFrame.contents().find('body').html(),
                decodedResponse = Base64.base64Decode(responseData),
                responseJson    = JSON.parse(decodedResponse);

            // Receiving a "success" string back from the server would mean that we'd
            // submitted the form as a whole, rather than just updated assets.
            if (!responseJson.success) {
                StorefrontSeedForm.displayNewAsset( e, responseJson );
            }
            else if (responseJson.success == true) {
                window.location.reload();
            }
        });

        this.additionalMassFileFields.change( function( e ) {
            // console.log(e)
        });

        this.removeButtons.live('click', function( e ) {
            e.preventDefault();

            // Find the id of the content_instance being removed
            var id = jQuery(this).parent().attr('rel'),
                // Find the name of container so that we can remove the id from the correct data field.
                fileType = jQuery(this).parents('.uploaded-images')[0].getAttribute('rel');

            StorefrontSeedForm.xhr(
                'remove_asset', 
                StorefrontSeedForm.removeThumbnail,
                StorefrontSeedForm.xhrFailed,
                {
                 id: id,
                 attribute_field_name: fileType,
                 storefront_seed_id: StorefrontSeedForm.storefrontSeedID
                }
            );
        });
    },

    removeThumbnail: function( data, statusText ) {
        jQuery('.thumbnail-container').filter('[rel="' + data.id + '"]').remove();
    },

    xhrFailed: function( data, statusText ) {
        // console.log(statusText);
    },

    displayNewAsset: function( e, data ) {
        for (var fileType in data) {
            var container = this.assetContainers.filter('[rel="' + fileType + '"]');
            container = container.children('.assets-container');

            container.append( this.buildThumbnailFromAsset( data[fileType] ) );
        }

        this.addButton.html('<span style="width:80px" href="#" class="dylan-button submit save submit">Add</span>');

        // Since every image upload field is submitted simultaneously, clear current values from
        // each field to prevent accidental re-uploading or visual duplication.
        jQuery('input[type="file"]', this.mainForm).val('');

        StorefrontSeedForm.videoAddButton.removeClass('searching-spinner').addClass('icon-add');
        StorefrontSeedForm.additionalAddButton.removeClass('searching-spinner').addClass('icon-add');
    },

    buildThumbnailFromAsset: function(asset) {
        var skel = this.thumbnailSkeleton.clone(),
            date = new Date();

        // Fill in this thumbnail's data.
        skel.attr('rel', asset.id);
        skel.find('a').attr('href', asset.asset_url);
        skel.find('img').attr('src', asset.thumb_url);
        skel.find('.thumbnail-filename').text( asset.filename );
        skel.find('.thumbnail-date').text(
            'added ' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
        );

        return skel;
    },

    xhr: function(action, success, failure, params) {
        var context = this,
            // These 'scoped' wrappers ensure callbacks get the right context.
            scopedSuccess = function(data, statusText) {
                success.call(context, data, statusText);
            },
            scopedError = function(data, statusText) {
                failure.call(context, data, statusText);
            };

        // Ensure unset arguments aren't passed to the server.
        //for (prop in params) {
        //    if (params[prop] === undefined) delete params[prop];
        //}

        // Fire the request.
        jQuery.ajax({
            url:      '/community/admin/account_builder/storefront_seed/' + action,
            dataType: 'json',
            success:  scopedSuccess,
            error:    scopedError,
            data:     params
        });
    }

};

