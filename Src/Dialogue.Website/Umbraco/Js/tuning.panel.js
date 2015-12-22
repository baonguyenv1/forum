
/*********************************************************************************************************/
/* Global function and variable for panel/page com  */
/*********************************************************************************************************/

/* Called for every tuning-over rollover */
var refrechIntelTuning = function (name) {

    var scope = angular.element($("#tuningPanel")).scope();

    if (scope.schemaFocus != name.toLowerCase()) {

        var notFound = true;
        angular.forEach(scope.tuningModel.categories, function (category, key) {
            var isContainer = false;
            angular.forEach(category.sections, function (section, key) {
                angular.forEach(section.subSections, function (subSection, key) {
                    if (subSection.name && name.toLowerCase() == subSection.name.toLowerCase()) {
                        isContainer = true;
                        notFound = false
                    }

                });
            });
            if (!category.active) {
                category.active = isContainer;
            }
        });
        if (notFound) {
            scope.tuningModel.categories[0].active = true;
        }
        scope.$apply();

        if (notFound) {
            scope.schemaFocus = "body";
        }
        else {
            scope.schemaFocus = name.toLowerCase();
        }

        scope.$apply();
    }
}

/* Called when the iframe is first loaded */
var setFrameIsLoaded = function (tuningParameterUrl, tuningGridList) {
    var scope = angular.element($("#tuningPanel")).scope();
    scope.tuningParameterUrl = tuningParameterUrl;
    scope.tuningGridList = tuningGridList
    scope.enableTuning++;
    scope.$apply();
}
/*********************************************************************************************************/
/* tuning panel app and controller */
/*********************************************************************************************************/

// tuning main app
angular.module("umbraco.tuning", ['ui.bootstrap', 'spectrumcolorpicker', 'ui.slider', 'umbraco.resources', 'umbraco.services'])

// panel main controller
.controller("Umbraco.tuningController", function ($scope, $modal, $http, $window, $timeout, $location) {

    $scope.isOpen = false;
    $scope.frameLoaded = false;
    $scope.enableTuning = 0;
    $scope.tuningParameterUrl = "";
    $scope.tuningGridList = "";
    $scope.schemaFocus = "body";
    $scope.settingIsOpen = 'previewDevice';
    $scope.BackgroundPositions = ['center', 'left', 'right', 'bottom center', 'bottom left', 'bottom right', 'top center', 'top left', 'top right'];
    $scope.BackgroundRepeats = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'];
    $scope.BackgroundAttachments = ['scroll', 'fixed'];
    $scope.Layouts = ['boxed', 'wide', 'full'];
    $scope.displays = ['float-left', 'float-right', 'block-left', 'block-right', 'none'];
    $scope.optionHomes = ['icon', 'text', 'none'];
    $scope.googleFontFamilies = {};
    $scope.pageId = "../dialogs/Preview.aspx?id=" + $location.search().id;
    $scope.devices = [
        { name: "desktop", css: "desktop", icon: "icon-display" },
        { name: "laptop - 1366px", css: "laptop border", icon: "icon-laptop" },
        { name: "iPad portrait - 768px", css: "iPad-portrait border", icon: "icon-ipad" },
        { name: "iPad landscape - 1024px", css: "iPad-landscape border", icon: "icon-ipad flip" },
        { name: "smartphone portrait - 480px", css: "smartphone-portrait border", icon: "icon-iphone" },
        { name: "smartphone landscape  - 320px", css: "smartphone-landscape border", icon: "icon-iphone flip" }
    ];
    $scope.previewDevice = $scope.devices[0];

    /*****************************************************************************/
    /* Preview devices */
    /*****************************************************************************/

    // Set preview device
    $scope.updatePreviewDevice = function (device) {
        $scope.previewDevice = device;
    }

    /*****************************************************************************/
    /* UI designer managment */
    /*****************************************************************************/

    // Update all tuningConfig's values from data
    var updateConfigValue = function (data) {

        var fonts = [];
        $.each(tuningConfig.categories, function (indexCategory, category) {
            $.each(category.sections, function (indexSection, section) {
                $.each(section.subSections, function (indexSubSection, subSection) {
                    $.each(subSection.fields, function (indexField, field) {

                        try {

                            // value
                            var newValue = eval("data." + field.alias.replace("@", ""));
                            if (newValue != undefined) {
                                field.value = newValue;
                                if (field.value == "''") { field.value = ""; }
                            }

                            // special init for font family picker
                            if (field.type == "fontFamilyPicker") {

                                var fontWeight = eval("data." + field.alias.replace("@", "") + "_weight");
                                var fontStyle = eval("data." + field.alias.replace("@", "") + "_style");
                                var fontType = eval("data." + field.alias.replace("@", "") + "_type");

                                if (fontWeight != undefined) {
                                    field.fontWeight = fontWeight;
                                    if (field.fontWeight == "''") { field.fontWeight = ""; }
                                }

                                if (fontStyle != undefined) {
                                    field.fontStyle = fontStyle;
                                    if (field.fontStyle == "''") { field.fontStyle = ""; }
                                }

                                if (fontType != undefined) {
                                    field.fontType = fontType;
                                    if (field.fontType == "''") { field.fontType = ""; }
                                }

                                if (fontType == 'google' && field.value + field.fontWeight && $.inArray(field.value + ":" + field.fontWeight, fonts) < 0) {
                                    fonts.splice(0, 0, field.value + ":" + field.fontWeight);
                                }

                            }

                        }
                        catch (err) {
                            console.info("Style parameter not found " + field.alias);
                        }

                    })
                })
            })
        });

        // Load google font
        $.each(fonts, function (indexFont, font) {
            loadGoogleFont(font);
            loadGoogleFontInFront(font);
        });

    }

    // Load parameters from GetLessParameters and init data of the tuning config
    var initTuning = function () {

        $http.get('/Umbraco/Api/tuning/Load', { params: { tuningStyleUrl: $scope.tuningParameterUrl, pageId: $location.search().id } })
            .success(function (data) {

                updateConfigValue(data);

                $scope.tuningModel = tuningConfig;
                $scope.tuningPalette = tuningPalette;

                if ($scope.settingIsOpen == "setting") {
                    openIntelTuning();
                }

            });

    }

    // Add Less parameters for each grid row
    var initGridConfig = function () {

        if ($scope.tuningGridList) {

            $.each($scope.tuningGridList, function (index, row) {

                var stylingSubSection = tuningConfig.categories[1].sections[0].subSections
                var newIndex = stylingSubSection.length + 1;
                var rowFieldModel = angular.copy(rowModel);

                var rowNumber = index + 1;
                rowFieldModel.name = "Grid Row " + rowNumber;
                stylingSubSection.splice(newIndex + 1, 0, rowFieldModel);
                stylingSubSection[newIndex - 1].schema = "." + row;

                $.each(stylingSubSection[newIndex - 1].fields, function (indexField, field) {
                    field.alias = field.alias + "__" + row;
                });

            })
        }

    }

    // Refresh all less parameters for every changes watching tuningModel 
    var refreshtuning = function () {
        var parameters = [];

        if ($scope.tuningModel) {
            $.each($scope.tuningModel.categories, function (indexCategory, category) {
                $.each(category.sections, function (indexSection, section) {
                    $.each(section.subSections, function (indexSubSection, subSection) {
                        $.each(subSection.fields, function (indexField, field) {

                            // value
                            parameters.splice(parameters.length + 1, 0, "'@" + field.alias + "':'" + field.value + "'");

                            // special init for font family picker
                            if (field.type == "fontFamilyPicker") {
                                parameters.splice(parameters.length + 1, 0, "'@" + field.alias + "_weight':'" + field.fontWeight + "'");
                                parameters.splice(parameters.length + 1, 0, "'@" + field.alias + "_Style':'" + field.fontStyle + "'");
                            }

                        })
                    })
                })
            });

            // Refrech page style
            refreshFrontStyles(parameters);
            
        }
    }

    // Save all parameter in tuningParameters.less file
    $scope.saveLessParameters = function () {

        var parameters = [];
        var parametersGrid = [];
        $.each($scope.tuningModel.categories, function (indexCategory, category) {
            $.each(category.sections, function (indexSection, section) {
                $.each(section.subSections, function (indexSubSection, subSection) {
                    $.each(subSection.fields, function (indexField, field) {

                        if (subSection.schema && subSection.schema.indexOf("gridrow_") >= 0) {
                            var value = (field.value != 0 && (field.value == undefined || field.value == "")) ? "''" : field.value;
                            parametersGrid.splice(parametersGrid.length + 1, 0, "@" + field.alias + ":" + value + ";");
                        }
                        else {
                            // value
                            var value = (field.value != 0 && (field.value == undefined || field.value == "")) ? "''" : field.value;
                            parameters.splice(parameters.length + 1, 0, "@" + field.alias + ":" + value + ";");

                            // special init for font family picker
                            if (field.type == "fontFamilyPicker") {
                                if (field.fontType == "google" && value != "''") {
                                    var variant = field.fontWeight != "" || field.fontStyle != "" ? ":" + field.fontWeight + field.fontStyle : "";
                                    var gimport = "@import url('http://fonts.googleapis.com/css?family=" + value + variant + "');";
                                    if ($.inArray(gimport, parameters) < 0) {
                                        parameters.splice(0, 0, gimport);
                                    }
                                }
                                var fontWeight = (field.fontWeight != 0 && (field.fontWeight == undefined || field.fontWeight == "")) ? "''" : field.fontWeight;
                                var fontStyle = (field.fontStyle != 0 && (field.fontStyle == undefined || field.fontStyle == "")) ? "''" : field.fontStyle;
                                var fontType = (field.fontType != 0 && (field.fontType == undefined || field.fontType == "")) ? "''" : field.fontType;
                                parameters.splice(parameters.length + 1, 0, "@" + field.alias + "_weight:" + fontWeight + ";");
                                parameters.splice(parameters.length + 1, 0, "@" + field.alias + "_style:" + fontStyle + ";");
                                parameters.splice(parameters.length + 1, 0, "@" + field.alias + "_type:" + fontType + ";");
                            }
                        }

                    })
                })
            })
        });

        var resultParameters = { parameters: parameters.join(""), parametersGrid: parametersGrid.join(""), pageId: $location.search().id };
        var transform = function (result) {
            return $.param(result);
        }

        $('.btn-default-save').attr("disabled", true);
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        $http.post('/Umbraco/Api/tuning/Save', resultParameters, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            transformRequest: transform
        })
        .success(function (data) {
            $('.btn-default-save').attr("disabled", false);
            $('#speechbubble').fadeIn('slow').delay(5000).fadeOut('slow');
        });

    }

    // Delete current page tuning
    $scope.deleteTuning = function () {
        $('.btn-default-delete').attr("disabled", true);
        $http.get('/Umbraco/Api/tuning/Delete', { params: { pageId: $location.search().id } })
        .success(function (data) {
            $scope.enableTuning++;
            $scope.pageId = $scope.pageId + "&n=123456";
            $('.btn-default-delete').attr("disabled", false);
        })
    }

    /*****************************************************************************/
    /* Preset design */
    /*****************************************************************************/

    // Refresh with selected tuning palette
    $scope.refreshtuningByPalette = function (palette) {
        updateConfigValue(palette.colors);
        refreshtuning();
    }

    // Hidden botton to make preset from the current settings
    $scope.makePreset = function () {

        var parameters = [];
        $.each($scope.tuningModel.categories, function (indexCategory, category) {
            $.each(category.sections, function (indexSection, section) {
                $.each(section.subSections, function (indexSubSection, subSection) {
                    $.each(subSection.fields, function (indexField, field) {

                        if (!subSection.schema || subSection.schema.indexOf("gridrow_") < 0) {

                            // value
                            var value = (field.value != 0 && (field.value == undefined || field.value == "")) ? "''" : field.value;
                            parameters.splice(parameters.length + 1, 0, "\"" + field.alias + "\":" + " \"" + value + "\"");

                            // special init for font family picker
                            if (field.type == "fontFamilyPicker") {
                                var fontWeight = (field.fontWeight != 0 && (field.fontWeight == undefined || field.fontWeight == "")) ? "''" : field.fontWeight;
                                var fontStyle = (field.fontStyle != 0 && (field.fontStyle == undefined || field.fontStyle == "")) ? "''" : field.fontStyle;
                                var fontType = (field.fontType != 0 && (field.fontType == undefined || field.fontType == "")) ? "''" : field.fontType;
                                parameters.splice(parameters.length + 1, 0, "\"" + field.alias + "_weight" + "\":" + " \"" + fontWeight + "\"");
                                parameters.splice(parameters.length + 1, 0, "\"" + field.alias + "_style" + "\":" + " \"" + fontStyle + "\"");
                                parameters.splice(parameters.length + 1, 0, "\"" + field.alias + "_type" + "\":" + " \"" + fontType + "\"");
                            }

                        }

                    })
                })
            })
        });

        $("body").append("<textarea>{name:\"\", mainColor:\"\", colors:{" + parameters.join(",") + "}}</textarea>");

    }

    /*****************************************************************************/
    /* Panel managment */
    /*****************************************************************************/

    // Toggle panel
    $scope.togglePanel = function () {
        if ($scope.isOpen) {
            $scope.isOpen = false;
            closeIntelTuning();
        }
        else {
            $scope.isOpen = true;
            $scope.settingOpen($scope.settingIsOpen);
        }
    }

    // Toggle setting
    $scope.settingOpen = function (a) {

        if ($scope.settingIsOpen == "setting" && a != "setting") {
            closeIntelTuning();
        }

        if (a == "setting") {
            openIntelTuning();
        }

        $scope.settingIsOpen = a;
    }

    // Remove value from field
    $scope.removeField = function (field) {
        field.value = "";
    }

    // Open image picker modal
    $scope.open = function (field) {
        $scope.data = {
            newFolder: "",
            modalField: field
        };

        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'myModalContent.html',
            controller: 'tuning.mediapickercontroller',
            resolve: {
                items: function () {
                    return field.value;
                }
            }
        });
        modalInstance.result.then(function (selectedItem) {
            field.value = selectedItem;
        });
    };

    // Open font family picker modal
    $scope.openFontFamilyPickerModal = function (field) {
        $scope.data = {
            modalField: field
        };
        var modalInstance = $modal.open({
            scope: $scope,
            templateUrl: 'fontFamilyPickerModel.html',
            controller: 'tuning.fontfamilypickercontroller',
            resolve: {
                googleFontFamilies: function () {
                    return $scope.googleFontFamilies;
                },
                item: function () {
                    return field;
                }
            }
        });
        modalInstance.result.then(function (selectedItem) {
            field.value = selectedItem.fontFamily;
            field.fontType = selectedItem.fontType;
            field.fontWeight = selectedItem.fontWeight;
            field.fontStyle = selectedItem.fontStyle;
        });
    };

    // Accordion open event
    $scope.accordionOpened = function (schema) {
        $scope.schemaFocus = schema;
    }

    // Focus schema in front
    $scope.accordionWillBeOpened = function (schema) {
        if (schema) {
            setSelectedSchema(schema);
        }
    }

    /*****************************************************************************/
    /* Call function into the front-end   */
    /*****************************************************************************/

    var openIntelTuning = function () {
        if (document.getElementById("resultFrame").contentWindow.initIntelTuning)
            document.getElementById("resultFrame").contentWindow.initIntelTuning($scope.tuningModel);
    }

    var closeIntelTuning = function () {
        if (document.getElementById("resultFrame").contentWindow.closeIntelTuning)
            document.getElementById("resultFrame").contentWindow.closeIntelTuning($scope.tuningModel);
    }

    var loadGoogleFontInFront = function (font) {
        if (document.getElementById("resultFrame").contentWindow.getFont)
            document.getElementById("resultFrame").contentWindow.getFont(font);
    }

    var setSelectedSchema = function (schema) {
        if (document.getElementById("resultFrame").contentWindow.setSelectedSchema)
            document.getElementById("resultFrame").contentWindow.setSelectedSchema(schema);
    }

    var refreshFrontStyles = function (parameters) {
        if (document.getElementById("resultFrame").contentWindow.refrechLayout)
            document.getElementById("resultFrame").contentWindow.refrechLayout(parameters);
    }

    /*****************************************************************************/
    /* Google font loader, TODO: put together from directive, front and back */
    /*****************************************************************************/

    var webFontScriptLoaded = false;
    var loadGoogleFont = function (font) {
        if (!webFontScriptLoaded) {
            $.getScript('http://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js')
            .done(function () {
                webFontScriptLoaded = true;
                // Recursively call once webfont script is available.
                loadGoogleFont(font);
            })
            .fail(function () {
                console.log('error loading webfont');
            });
        }
        else {
            WebFont.load({
                google: {
                    families: [font]
                },
                loading: function () {
                    console.log('loading font' + font + ' in UI designer');
                },
                active: function () {
                    console.log('loaded font ' + font + ' in UI designer');
                },
                inactive: function () {
                    console.log('error loading font ' + font + ' in UI designer');
                }
            });
        }
    }

    /*****************************************************************************/
    /* Init */
    /*****************************************************************************/

    // Preload of the google font
    $http.get('/Umbraco/Api/tuning/GetGoogleFont').success(function (data) {
        $scope.googleFontFamilies = data;
    })

    // watch framLoaded, only if iframe page have EnableTuning()
    $scope.$watch("enableTuning", function () {
        if ($scope.enableTuning > 0) {
            if ($scope.enableTuning == 1) {
                initGridConfig();
            }
            initTuning();
            $scope.$watch('tuningModel', function () {
                refreshtuning();
            }, true);
        }
    }, true)

    // First default load
    $timeout(function () {
        // toggle panel
        $scope.frameLoaded = true;
        //$timeout(function () { 1000, $scope.togglePanel(); });
    }, 1000);

})

// Image picker controller
.controller('tuning.mediapickercontroller', function ($scope, $modalInstance, items, $http, mediaResource, umbRequestHelper, entityResource, mediaHelper) {

    if (mediaHelper && mediaHelper.registerFileResolver) {
        mediaHelper.registerFileResolver("Umbraco.UploadField", function (property, entity, thumbnail) {
            if (thumbnail) {

                if (mediaHelper.detectIfImageByExtension(property.value)) {
                    var thumbnailUrl = umbRequestHelper.getApiUrl(
                        "imagesApiBaseUrl",
                        "GetBigThumbnail",
                        [{ originalImagePath: property.value }]);

                    return thumbnailUrl;
                }
                else {
                    return null;
                }

            }
            else {
                return property.value;
            }
        });
    }

    var modalFieldvalue = $scope.data.modalField.value;

    $scope.currentFolder = {};
    $scope.currentFolder.children = [];
    $scope.currentPath = [];
    $scope.startNodeId = -1;

    $scope.options = {
        url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
        formData: {
            currentFolder: $scope.startNodeId
        }
    };

    //preload selected item
    $scope.selectedMedia = undefined;

    $scope.submitFolder = function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $scope.$parent.data.showFolderInput = false;

            if ($scope.$parent.data.newFolder && $scope.$parent.data.newFolder != "") {
                mediaResource
                    .addFolder($scope.$parent.data.newFolder, $scope.currentFolder.id)
                    .then(function (data) {
                        $scope.$parent.data.newFolder = undefined;
                        $scope.gotoFolder(data);
                    });
            }
        }
    };

    $scope.gotoFolder = function (folder) {

        if (!folder) {
            folder = { id: $scope.startNodeId, name: "Media", icon: "icon-folder" };
        }

        if (folder.id > 0) {
            var matches = _.filter($scope.currentPath, function (value, index) {
                if (value.id == folder.id) {
                    value.indexInPath = index;
                    return value;
                }
            });

            if (matches && matches.length > 0) {
                $scope.currentPath = $scope.currentPath.slice(0, matches[0].indexInPath + 1);
            }
            else {
                $scope.currentPath.push(folder);
            }
        }
        else {
            $scope.currentPath = [];
        }

        //mediaResource.rootMedia()
        mediaResource.getChildren(folder.id)
            .then(function (data) {
                folder.children = data.items ? data.items : [];

                angular.forEach(folder.children, function (child) {
                    child.isFolder = child.contentTypeAlias == "Folder" ? true : false;

                    if (!child.isFolder) {
                        child.thumbnail = mediaHelper.resolveFile(child, true);
                        child.image = mediaHelper.resolveFile(child, false);
                    }
                });

                $scope.options.formData.currentFolder = folder.id;
                $scope.currentFolder = folder;
            });
    };

    $scope.iconFolder = "glyphicons-icon folder-open"

    $scope.selectMedia = function (media) {

        if (!media.isFolder) {
            //we have 3 options add to collection (if multi) show details, or submit it right back to the callback
            $scope.selectedMedia = media;
            $scope.data.modalField.value = "url(" + $scope.selectedMedia.image + ")";
        }
        else {
            $scope.gotoFolder(media);
        }
    };

    //default root item
    if (!$scope.selectedMedia) {
        $scope.gotoFolder();
    }

    $scope.ok = function () {
        $modalInstance.close($scope.data.modalField.value);
    };

    $scope.cancel = function () {
        $scope.data.modalField.value = modalFieldvalue;
        $modalInstance.dismiss('cancel');
    };

})

// Font picker controller
.controller('tuning.fontfamilypickercontroller', function ($scope, $modalInstance, item, googleFontFamilies, $http) {

    $scope.safeFonts = ["Arial, Helvetica", "Impact", "Lucida Sans Unicode", "Tahoma", "Trebuchet MS", "Verdana", "Georgia", "Times New Roman", "Courier New, Courier"];
    $scope.fonts = [];
    $scope.selectedFont = {};

    var originalFont = {};
    originalFont.fontFamily = $scope.data.modalField.value;
    originalFont.fontType = $scope.data.modalField.fontType;
    originalFont.fontWeight = $scope.data.modalField.fontWeight;
    originalFont.fontStyle = $scope.data.modalField.fontStyle;

    var googleGetWeight = function (googleVariant) {
        return (googleVariant != undefined && googleVariant != "") ? googleVariant.replace("italic", "") : "";
    };

    var googleGetStyle = function (googleVariant) {
        var variantStyle = "";
        if (googleVariant != undefined && googleVariant != "" && googleVariant.indexOf("italic") >= 0) {
            variantWeight = googleVariant.replace("italic", "");
            variantStyle = "italic";
        }
        return variantStyle;
    };

    angular.forEach($scope.safeFonts, function (value, key) {
        $scope.fonts.push({
            groupName: "Safe fonts",
            fontType: "safe",
            fontFamily: value,
            fontWeight: "normal",
            fontStyle: "normal",
        });
    });

    angular.forEach(googleFontFamilies.items, function (value, key) {
        var variants = value.variants;
        var variant = value.variants.length > 0 ? value.variants[0] : "";
        var fontWeight = googleGetWeight(variant);
        var fontStyle = googleGetStyle(variant);
        $scope.fonts.push({
            groupName: "Google fonts",
            fontType: "google",
            fontFamily: value.family,
            variants: value.variants,
            variant: variant,
            fontWeight: fontWeight,
            fontStyle: fontStyle
        });
    });

    $scope.setStyleVariant = function () {
        if ($scope.selectedFont != undefined) {
            return {
                'font-family': $scope.selectedFont.fontFamily,
                'font-weight': $scope.selectedFont.fontWeight,
                'font-style': $scope.selectedFont.fontStyle
            }
        }
    };

    $scope.showFontPreview = function (font) {
        if (font != undefined && font.fontFamily != "" && font.fontType == "google") {

            // Font needs to be independently loaded in the iframe for live preview to work.
            document.getElementById("resultFrame").contentWindow.getFont(font.fontFamily + ":" + font.variant);

            WebFont.load({
                google: {
                    families: [font.fontFamily + ":" + font.variant]
                },
                loading: function () {
                    console.log('loading');
                },
                active: function () {
                    // If $apply isn't called, the new font family isn't applied until the next user click.
                    $scope.$apply(function () {
                        $scope.selectedFont = font;
                        $scope.selectedFont.fontWeight = googleGetWeight($scope.selectedFont.variant);
                        $scope.selectedFont.fontStyle = googleGetStyle($scope.selectedFont.variant);
                        // Apply to the page content as a preview.
                        $scope.data.modalField.value = $scope.selectedFont.fontFamily;
                        $scope.data.modalField.fontType = $scope.selectedFont.fontType;
                        $scope.data.modalField.fontWeight = $scope.selectedFont.fontWeight;
                        $scope.data.modalField.fontStyle = $scope.selectedFont.fontStyle;
                    });
                }
            });
        }
        else {
            // Font is available, apply it immediately in modal preview.
            $scope.selectedFont = font;
            // And to page content.
            $scope.data.modalField.value = $scope.selectedFont.fontFamily;
            $scope.data.modalField.fontType = $scope.selectedFont.fontType;
            $scope.data.modalField.fontWeight = $scope.selectedFont.fontWeight;
            $scope.data.modalField.fontStyle = $scope.selectedFont.fontStyle;
        }
    }

    $scope.ok = function () {
        $modalInstance.close({
            fontFamily: $scope.selectedFont.fontFamily,
            fontType: $scope.selectedFont.fontType,
            fontWeight: $scope.selectedFont.fontWeight,
            fontStyle: $scope.selectedFont.fontStyle,
        });
    };

    $scope.cancel = function () {
        // Discard font change.
        $modalInstance.close({
            fontFamily: originalFont.fontFamily,
            fontType: originalFont.fontType,
            fontWeight: originalFont.fontWeight,
            fontStyle: originalFont.fontStyle,
        });
    };

    if (item != undefined) {
        angular.forEach($scope.fonts, function (value, key) {
            if (value.fontFamily == item.value) {
                $scope.selectedFont = value;
                $scope.selectedFont.variant = item.fontWeight + item.fontStyle;
                $scope.selectedFont.fontWeight = item.fontWeight;
                $scope.selectedFont.fontStyle = item.fontStyle;
            }
        });
    }

});

/*********************************************************************************************************/
/* jQuery UI Slider plugin wrapper */
/*********************************************************************************************************/

angular.module('ui.slider', []).value('uiSliderConfig', {}).directive('uiSlider', ['uiSliderConfig', '$timeout', function (uiSliderConfig, $timeout) {
    uiSliderConfig = uiSliderConfig || {};
    return {
        require: 'ngModel',
        template: '<div><div class="slider" /><span class="slider-span">px</span><input class="slider-input" ng-model="value"></div>',
        replace: true,
        compile: function () {
            return function (scope, elm, attrs, ngModel) {

                scope.value = ngModel.$viewValue;

                function parseNumber(n, decimals) {
                    return (decimals) ? parseFloat(n) : parseInt(n);
                };

                var options = angular.extend(scope.$eval(attrs.uiSlider) || {}, uiSliderConfig);
                // Object holding range values
                var prevRangeValues = {
                    min: null,
                    max: null
                };

                // convenience properties
                var properties = ['min', 'max', 'step'];
                var useDecimals = (!angular.isUndefined(attrs.useDecimals)) ? true : false;

                var init = function () {
                    // When ngModel is assigned an array of values then range is expected to be true.
                    // Warn user and change range to true else an error occurs when trying to drag handle
                    if (angular.isArray(ngModel.$viewValue) && options.range !== true) {
                        console.warn('Change your range option of ui-slider. When assigning ngModel an array of values then the range option should be set to true.');
                        options.range = true;
                    }

                    // Ensure the convenience properties are passed as options if they're defined
                    // This avoids init ordering issues where the slider's initial state (eg handle
                    // position) is calculated using widget defaults
                    // Note the properties take precedence over any duplicates in options
                    angular.forEach(properties, function (property) {
                        if (angular.isDefined(attrs[property])) {
                            options[property] = parseNumber(attrs[property], useDecimals);
                        }
                    });

                    elm.find(".slider").slider(options);
                    init = angular.noop;
                };

                // Find out if decimals are to be used for slider
                angular.forEach(properties, function (property) {
                    // support {{}} and watch for updates
                    attrs.$observe(property, function (newVal) {
                        if (!!newVal) {
                            init();
                            elm.find(".slider").slider('option', property, parseNumber(newVal, useDecimals));
                        }
                    });
                });
                attrs.$observe('disabled', function (newVal) {
                    init();
                    elm.find(".slider").slider('option', 'disabled', !!newVal);
                });

                // Watch ui-slider (byVal) for changes and update
                scope.$watch(attrs.uiSlider, function (newVal) {
                    init();
                    if (newVal != undefined) {
                        elm.find(".slider").slider('option', newVal);
                    }
                }, true);

                // Late-bind to prevent compiler clobbering
                $timeout(init, 0, true);

                // Update model value from slider
                elm.find(".slider").bind('slidestop', function (event, ui) {
                    ngModel.$setViewValue(ui.values || ui.value);
                    scope.$apply();
                });

                elm.bind('slide', function (event, ui) {
                    event.stopPropagation();
                    elm.find(".slider-input").val(ui.value);
                });

                // Update slider from model value
                ngModel.$render = function () {
                    init();
                    var method = options.range === true ? 'values' : 'value';

                    if (isNaN(ngModel.$viewValue) && !(ngModel.$viewValue instanceof Array))
                        ngModel.$viewValue = 0;

                    scope.value = ngModel.$viewValue;

                    // Do some sanity check of range values
                    if (options.range === true) {

                        // Check outer bounds for min and max values
                        if (angular.isDefined(options.min) && options.min > ngModel.$viewValue[0]) {
                            ngModel.$viewValue[0] = options.min;
                        }
                        if (angular.isDefined(options.max) && options.max < ngModel.$viewValue[1]) {
                            ngModel.$viewValue[1] = options.max;
                        }

                        // Check min and max range values
                        if (ngModel.$viewValue[0] >= ngModel.$viewValue[1]) {
                            // Min value should be less to equal to max value
                            if (prevRangeValues.min >= ngModel.$viewValue[1])
                                ngModel.$viewValue[0] = prevRangeValues.min;
                            // Max value should be less to equal to min value
                            if (prevRangeValues.max <= ngModel.$viewValue[0])
                                ngModel.$viewValue[1] = prevRangeValues.max;
                        }

                        // Store values for later user
                        prevRangeValues.min = ngModel.$viewValue[0];
                        prevRangeValues.max = ngModel.$viewValue[1];

                    }
                    elm.find(".slider").slider(method, ngModel.$viewValue);
                };

                scope.$watch("value", function () {
                    ngModel.$setViewValue(scope.value);
                }, true);

                scope.$watch(attrs.ngModel, function () {
                    if (options.range === true) {
                        ngModel.$render();
                    }
                }, true);

                function destroy() {
                    elm.find(".slider").slider('destroy');
                }
                elm.find(".slider").bind('$destroy', destroy);
            };
        }
    };
}]);



/*********************************************************************************************************/
/* spectrum color picker directive */
/*********************************************************************************************************/

angular.module('spectrumcolorpicker', [])
  .directive('spectrum', function () {
      return {
          restrict: 'E',
          transclude: true,
          scope: {
              colorselected: '='
          },
          link: function (scope, $element) {

              var initColor;

              $element.find("input").spectrum({
                  color: scope.colorselected,
                  preferredFormat: "rgb",
                  showAlpha: true,
                  showInput: true,
                  change: function (color) {
                      scope.colorselected = color.toRgbString();
                      scope.$apply();
                  },
                  move: function (color) {
                      scope.colorselected = color.toRgbString();
                      scope.$apply();
                  },
                  beforeShow: function (color) {
                      initColor = angular.copy(scope.colorselected);
                      $(this).spectrum("container").find(".sp-cancel").click(function (e) {
                          scope.colorselected = initColor;
                          scope.$apply();
                      });
                  },

              });

              scope.$watch('colorselected', function () {
                  $element.find("input").spectrum("set", scope.colorselected);
              }, true);

          },
          template:
          '<div><input type=\'text\' ng-model=\'colorselected\' /></div>',
          replace: true
      };
  })