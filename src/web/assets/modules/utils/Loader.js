/*
Loader.js
Loader module, handles loading assets.

load base message (c) MIT
*/
var KAIOPUA = (function ( main ) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/utils/Loader",
        loader = {},
        threeLoaderJSON,
        threeLoaderBIN,
        threeLoaderErrorMessage = 'Attempted to load model before THREE',
        listIDBase = 'loadList',
        loadingHeaderBase = 'Loading...',
        loadingTips = [
            'Please wait.'
        ],
        listNumber = 0,
        loading = false,
        listsToLoad = [],
        loadingMessages = {},
        locations = {},
        callbacks = {},
        loaded = {},
		allLoading = [],
		allLoadingListIDs = [],
		allStarted = [],
		allLoaded = [],
		allLoadingOrLoaded = [],
        listCurrent,
        barWidth = 260,
        barHeight = 12,
        barFillSpace = 2,
        barColor = '#FFFFFF',
        fillColor = '#FFFFFF',
        bar,
        fill,
        header,
        message,
        domElement;
    
    /*===================================================
    
    public properties
    
    =====================================================*/
	
	loader.init_ui = init_ui;
    loader.clear_ui_progress = clear_ui_progress;
    loader.load = load_list;
	loader.add_loaded_locations = add_loaded_locations;
	
	Object.defineProperty(loader, 'loadingHeader', { 
		get : function () { return loadingHeaderBase; },
		set: function ( newHeader ) {
			loadingHeaderBase = newHeader;
		}
	});
	
	Object.defineProperty(loader, 'loadingTips', { 
		get : function () { return loadingTips; },
		set: function ( newTips ) {
			loadingTips = newTips.slice( 1 );
		}
	});
	
	Object.defineProperty(loader, 'allLoadingOrLoaded', { 
		get : function () { return allLoadingOrLoaded; }
	});
	
	loader = main.asset_register( assetPath, loader, true );
	
    /*===================================================
    
    ui functions
    
    =====================================================*/
	
	main.assets_require( "assets/modules/workers/UIHelper", init_ui );
    
    function init_ui ( u ) {
		
		uihelper = u;
        
        loader = uihelper.make_ui_element({
            elementType: 'section',
            classes: 'info_panel',
            cssmap: {
                'padding' : '20px'
            }
        }, loader);
        
        domElement = loader.domElement;
        
        // bar
		
        bar = uihelper.make_ui_element({
            classes: 'load_bar',
            cssmap: {
                'border-style' : 'solid',
                'border-color' : barColor,
                'border-width' : '1px',
                'border-radius' : '5px'
            },
            staticPosition: true,
            width: barWidth,
            height: barHeight
        });
        
        // fill
		
        fill = uihelper.make_ui_element({
            cssmap: {
                'margin-left' : barFillSpace + 'px',
                'margin-top' : barFillSpace + 'px',
                'background' : fillColor,
                'border-radius' : '5px'
            },
            staticPosition: true,
            width: 0,
            height: barHeight - barFillSpace * 2
        });
        
        // header
        header = uihelper.make_ui_element({
            elementType: 'header',
            staticPosition: true,
            width: barWidth,
            text: loadingHeaderBase
        });
        
        // message
        message = uihelper.make_ui_element({
            elementType: 'p',
            staticPosition: true,
            width: barWidth,
            text: loadingTips[0]
        });
		
        // display
        
        $(bar.domElement).append( fill.domElement );
        
        $(domElement).append( header.domElement );
        $(domElement).append( bar.domElement );
        $(domElement).append( message.domElement );
        
        // center
        
        loader.ui_keep_centered();
		
		// hide
		
		loader.ui_hide( false, 0);
        
    }
    
    function update_ui_progress ( message ) {
        var locationsList, 
            loadedList,
            total,
            pct = 1;
		
		if ( typeof domElement !== 'undefined' ) {
			
			// set loading message
			
			if ( typeof message !== 'undefined' ) {
		
				$(message.domElement).html( message );
				
			}
        
			if ( typeof listCurrent !== 'undefined' ) {
				
				locationsList = locations[listCurrent];
				loadedList = loaded[listCurrent];
				total = locationsList.length + loadedList.length;
				
				if ( isNaN( total ) === false ) {
					pct = loadedList.length / total;
				}
				
				$(fill.domElement).width( (barWidth - barFillSpace * 2) *  pct );
				
			}
			else {
				clear_ui_progress();
			}
			
		}
		
    }
    
    function clear_ui_progress () {
		if ( typeof domElement !== 'undefined' ) {
			
			$(fill.domElement).width(0);
			
		}
    }
    
    /*===================================================
    
    loading functions
    
    =====================================================*/
	
	function add_loaded_locations ( locationsList ) {
		
		var i, l,
			locationsListCopy = [],
			location,
			path,
			pathCopy,
			ext,
			indexLoaded,
			indexLoading,
			locationAdded = false;
		
		if ( typeof locationsList !== 'undefined' ) {
			
			// get if list is not array
			
			if ( typeof locationsList === 'string' || locationsList.hasOwnProperty( 'length' ) === false ) {
				locationsList = [locationsList];
			}
			
			// copy list
			
			for ( i = 0, l = locationsList.length; i < l; i++ ) {
				
				location = locationsList[ i ];
				
				path = main.get_path( location );
				
				// get extension
				
				ext = main.get_ext( path );
				
				// if none
				
				if ( ext === '' ) {
					
					pathCopy = main.add_default_ext( path );
					
				}
				// has extension
				else {
					
					pathCopy = main.remove_ext( path );
					
				}
				
				locationsListCopy.push( pathCopy );
				
			}
			
			// merge lists
			
			locationsListCopy = locationsList.concat( locationsListCopy );
			
			// for each location
			
			for ( i = 0, l = locationsListCopy.length; i < l; i++ ) {
				
				location = locationsListCopy[ i ];
				
				path = main.get_path( location );
				
				// update all loading
				
				indexLoading = allLoading.indexOf( path );
				
				if ( indexLoading !== -1 ) {
					
					allLoadingListIDs.splice( indexLoading, 1 );
					
					allLoading.splice( indexLoading, 1 );
					
				}
				
				// update all loaded
				
				indexLoaded = allLoaded.indexOf( path );
				
				if ( indexLoaded === -1 ) {
					
					allLoaded.push( path );
					
					locationAdded = true;
					
				}
				
			}
			
			if ( locationAdded === true ) {
				
				allLoadingOrLoaded = allLoaded.concat( allLoading );
				
			}
		}
		
	}
    
    function load_list ( locationsList, callbackList, listID, loadingMessage ) {
		
		var i, l,
			location,
			path,
			indexLoading,
			indexLoaded,
			allLocationsLoaded = true,
			assetData;
		
        if ( typeof locationsList !== 'undefined' ) {
            
            // get if list is not array
            
            if ( typeof locationsList === 'string' || locationsList.hasOwnProperty( 'length' ) === false ) {
                locationsList = [locationsList];
            }
			
			// make a copy of locations list
			
			locationsList = locationsList.slice( 0 );
			
			// handle list id
			
			if ( typeof listID !== 'string' ||  locations.hasOwnProperty( listID )) {
				
				listID = listIDBase + listNumber;
				
			}
			
			// permanent store of all loading
			
			for ( i = 0, l = locationsList.length; i < l; i++ ) {
				
				location = locationsList[ i ];
				
				path = main.get_path( location );
				
				indexLoading = allLoading.indexOf( path );
				indexLoaded = allLoaded.indexOf( path );
				
				// if not already loading or loaded item
				// load new location
				if ( indexLoading === -1 && indexLoaded == -1 ) {
					
					allLoading.push( path );
					
					allLoadingListIDs.push( listID );
					
					newLocations = true;
					
				}
				
				// if not yet loaded, mark list for loading
				
				if ( indexLoaded === -1 ) {
					
					allLocationsLoaded = false;
					
				}
				
			}
			
			allLoadingOrLoaded = allLoaded.concat( allLoading );
			
			// increase list number
			
			listNumber += 1;
			
			// temporary store locations
			
			locations[listID] = locationsList;
			
			// temporary store callback list
			
			if ( typeof callbackList === 'undefined' ) {
				callbackList = [];
			}
			else if ( typeof callbackList === 'function' || callbackList.hasOwnProperty( 'length' ) === false ) {
				callbackList = [callbackList];
			}
			
			callbacks[listID] = callbackList;
			
			// store load message
			
			if ( typeof loadingMessage !== 'string' ) {
				
				loadingMessage = loadingTips[Math.max(0, Math.min(loadingTips.length - 1, Math.round(Math.random() * loadingTips.length) - 1))];
			}
			
			loadingMessages[listID] = loadingMessage;
			
			// init new loaded array
			
			loaded[listID] = [];
			
			// add list ID to lists to load
				
			listsToLoad.push(listID);
			
			// if all locations in list are already loaded, skip loading process
			
			if ( allLocationsLoaded === true ) {
				
				list_completed( listID );
				
			}
			else {
				
				// start loading
				
				load_next_list();
				
			}
            
        }
		
    }
    
    function load_next_list () {
        var i, l,
			locationsList,
			location,
			path;
        
        // if any lists to load
		
        if ( loading === false && listsToLoad.length > 0 ) {
            
            loading = true;
            
            // get next list 
            
            listCurrent = listsToLoad[ 0 ];
			
			// update ui to reset fill
            
            update_ui_progress( loadingMessages[listCurrent] );
            
            // get locations, make copy because already loaded items will be removed from list immediately
            
            locationsList = locations[listCurrent].slice( 0 );
            
            // for each item location
            
            for (i = 0, l = locationsList.length; i < l; i += 1) {
                
                location = locationsList[ i ];
				
				path = main.get_path( location );
				
				// if already loaded
				
				if ( allLoaded.indexOf( path ) !== -1 ) {
					
					// make duplicate complete event
					
					load_single_completed( location );
					
				}
				// if not started loading yet
				else if ( allStarted.indexOf( path ) === -1 ) {
					
					// load it
					
					allStarted.push( path );
					
					load_single( location );
					
				}
            }
			
        }
        else {
            
			// no longer loading
			
			listCurrent = undefined;
			
            shared.signals.loadAllCompleted.dispatch();
            
        }
		
    }
    
    function load_single ( location ) {
        var loader,
            path, 
            ext, 
            loadType = 'script', 
            data,
            defaultCallback = function ( ) {
                load_single_completed( location, data );
            },
            modelCallback = function ( geometry ) {
                load_single_completed( location, geometry );
            };
        
        if ( typeof location !== 'undefined' ) {
            
            // load based on type of location and file extension
            
            // LAB handles scripts (js)
            // THREE handles models (ascii/bin js) and images (jpg/png/gif/bmp)
            
            // get type
            
            loadType = location.type || 'script';
            
            // get location path
            
            path = main.get_path( location );
            
            // get extension
            
            ext = main.get_ext( path );
			
			// ensure path has extension
			
			if ( ext === '' ) {
				
				path = main.add_default_ext( path );
				
			}
            
            // type and/or extension check
            
            if ( ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'bmp' ) {
				
				// load
                
                data = new Image();
                data.onload = defaultCallback;
                data.crossOrigin = '';
                data.src = path;
				
				// store empty image data in assets immediately
				
				main.asset_register( path, data );
                
            }
            else if ( loadType === 'model' || loadType === 'model_ascii' ) {
                
                if ( typeof THREE === 'undefined' ) {
                    main.utils.error.generate( threeLoaderErrorMessage, 'Loader' );
                }
                else {
                    
                    // init loader if needed
                    
                    if ( typeof threeLoaderJSON === 'undefined' ) {
                        threeLoaderJSON = new THREE.JSONLoader( true );
                    }
                    
                    threeLoaderJSON.load( path, modelCallback );
                }
            }
            // default to script loading
            else {
				
                $LAB.script( path ).wait( defaultCallback );
				
            }
			
        }
        
    }
    
    function load_single_completed ( location, data ) {
        var i, l,
			listID,
			locationsList,
			locationInCurrentList = false,
			index,
			path,
			listsCompleted;
        
        // get location path
        
        path = main.get_path( location );
		
		// register asset
		
		main.asset_register( path, data );
		
		// add as loaded
		
		add_loaded_locations( path );
		
		// shared signal
        
        if (typeof shared !== 'undefined') {
            
            shared.signals.loadItemCompleted.dispatch( path );
            
        }
        
        // for each list loading
		
		for ( i = 0, l = listsToLoad.length; i < l; i++ ) {
			
			listID = listsToLoad[ i ];
			
			locationsList = locations[ listID ];
			
			// get index in locations list
			
			index = locationsList.indexOf(location);
			
			// if is in list
			
			if ( index !== -1 ) {
				
				// if is current list
				
				if ( listID === listCurrent ) {
					
					// update ui
        
					update_ui_progress();
					
				}
				
				// remove location from locations list
				
				locationsList.splice(index, index !== -1 ? 1 : 0);
				
				// add location to loaded list
				
				loaded[ listID ].push( location );
				
				// if current list is complete, defer until all checked
				
				if ( locationsList.length === 0 ) {
					
					listsCompleted = listsCompleted || [];
					
					listsCompleted.push( listID );
					
				}
				
			}
			
		}
		
		// complete any completed lists
		if ( typeof listsCompleted !== 'undefined' ) {
			
			for ( i = 0, l = listsCompleted.length; i < l; i++ ) {
				
				list_completed( listsCompleted[ i ] );
				
			}
			
		}
		
    }
    
    function list_completed( listID ) {
        var i, l, 
			callbackList, 
			callback,
			listIndex;
		
		// remove list from all lists to load
		
		listIndex = listsToLoad.indexOf( listID );
		
		if ( listIndex !== -1 ) {
			
			listsToLoad.splice( listIndex, 1 );
			
		}
		
        // do callbacks before clear
		
		callbackList = callbacks[ listID ];
		
		for ( i = 0, l = callbackList.length; i < l; i++ ) {
			
			callback = callbackList[ i ];
			
			if ( typeof callback !== 'undefined' ) {
				
				callback.call( this );
				
			}
			
        }
		
        // shared signal
        
        if (typeof shared !== 'undefined') {
            
            shared.signals.loadListCompleted.dispatch( listID );
            
        }
        
		// clear
		
        delete locations[ listID ];
        
        delete callbacks[ listID ];
        
        delete loadingMessages[ listID ];
        
        delete loaded[ listID ];
		
		loading = false;
        
        // start next list
		
        load_next_list();
		
    }
    
    return main; 
    
}(KAIOPUA || {}));