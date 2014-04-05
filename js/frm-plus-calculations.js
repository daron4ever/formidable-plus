jQuery( function($){
	var me = FRM_PLUS_CALCULATIONS;
	
	$.extend( me, {
		/** 
		 * The event to watch to trigger recalculation.
		 * The keyup event makes changes to text fields trigger recalculation as they type
		 * The change event is necessary for select boxes
		 * older versions of IE may suffer performance hits using keyup on a form with lots of calculations.  
		 * Change this via something like jQuery(function($){FRM_PLUS_CALCULATIONS.keyup_event = 'change';})
		 */
		keyup_event: 'keyup change', // 
		
		/** 
		 * calculators is the internal cache of calculators
		 */
		calculators: {},

		/** 
		 * calculators that are the intersection of calculated rows and calculated columns
		 */
		special_calculators: {},
		
		init: function(){
			$.each( me.particulars, function( field_id, fields ){
				var table_selector = '#frm-table-' + field_id + ' ';
				
				// Sanitize Settings
				$.each( fields, function( key, settings ){
					if ( typeof settings.function == 'undefined' ){
						settings.function = 'sum'; // default to "Sum"
					}					
				});
				
				// Refactor Calculators - if we have multiple calculation lines in a single table, no need to add listeners
				// for each one.  Make a single listener and perform all calculations there
				var selectors = [];
				me.calculators[ field_id ] = {};
				me.special_calculators[ field_id ] = [];
				$.each( fields, function( key, settings ){
					$.each( settings[ me.getOpposite( key ) + 's' ], function( index, selector ){
						if ( typeof me.calculators[ field_id ][ selector ] == 'undefined' ){
							me.calculators[ field_id ][ selector ] = {};
						}
						me.calculators[ field_id ][ selector ][ key ] = settings;
						if ( selectors.indexOf( selector ) == -1 ){
							selectors.push( '.' + selector );
						}
						
						if ( typeof me.calculators[ field_id ][ key ] != 'undefined' && typeof me.calculators[ field_id ][ key ][ selector ] != 'undefined' && me.calculators[ field_id ][ key ][ selector ][ 'function' ] == settings.function ){
							// This is a case where a calculated column intersects with a calculated row.  We can handle that.  
							me.special_calculators[ field_id ].push( me.getOpposite( selector ) == 'column' ? { row: selector, column: key } : { row: key, column: selector } ); 
						}
					});
				});
				
				$( table_selector ).on( me.keyup_event, selectors.join( ',' ), function(e){
					if ( $(e.target).hasClass( 'calculation' ) ){
						// original target is a calculation field.  No further action required
						return;
					}
					
					// loop through all of the calculators for this selector
					var classes = $(this).attr( 'class' ).match( /(row|column)-[0-9]+/ ),
						inputs = $( table_selector + '.' + classes[0] + ' :input' ).not( '.calculation' );
						
					$.each( me.calculators[ field_id ][ classes[0] ], function( key, settings ){
						var target = table_selector;
						if ( classes[1] == 'row' )
							target += '.' + classes[0] + ' .' + key; // row must always come first in the target_input_selector
						else
							target += '.' + key + ' .' + classes[0];
						
						target += ' input.calculation';	
						
						$( target ).val(
							me.toFixed( 
								// this next line may look a little confusing, but it's just a compact way of calling a function
								// ( i.e. me.add() ) with either all of the inputs, or just the non-empty inputs ( depending on 
								// the value of settings.include_empty )
								me[ settings.function ]( inputs.filter( function(){
									if ( !settings.include_empty && $(this).val() == '' ){
										// easy
										return false;
									}
									// trickier.  This is saying to return true if this input has a parent that matches the selectors given by getOpposite
									return $(this).parentsUntil( 'table', '.' + settings[ me.getOpposite( classes[0] ) + 's' ].join( ', .' ) ).length > 0;
								}))
							, settings )
						);
					});
					
					$.each( me.special_calculators[ field_id ], function( index, calculator ){
						var settings, target = table_selector + '.' + calculator.row + ' .' + calculator.column + ' input.calculation';

						if ( classes[1] == 'column' ){
							// We've just calculated a row ( based on inputs in a column )
							inputs = $( table_selector + '.' + calculator.row + ' :input' ).not( function(){ return $(this).parents( 'td' ).hasClass( calculator.column ); } );
							settings = me.calculators[ field_id ][ calculator.column ][ calculator.row ];
						}
						else{
							inputs = $( table_selector + '.' + calculator.column + ' :input' ).not( function(){ return $(this).parents( 'tr' ).hasClass( calculator.row ); } );
							settings = me.calculators[ field_id ][ calculator.row ][ calculator.column ];
						}
						
						$( target ).data( 'result-' + classes[1], 
							me.toFixed( 
								// this next line may look a little confusing, but it's just a compact way of calling a function
								// ( i.e. me.add() ) with either all of the inputs, or just the non-empty inputs ( depending on 
								// the value of settings.include_empty )
								me[ settings.function ]( inputs.filter( function(){
									if ( !settings.include_empty && $(this).val() == '' ){
										// easy
										return false;
									}
									// trickier.  This is saying to return true if this input has a parent that matches the selectors 
									return $(this).parentsUntil( 'table', '.' + settings[ classes[1] + 's' ].join( ', .' ) ).length > 0;
								}))
							, settings )
						);
						
						if ( $( target ).data( 'result-row' ) == $( target ).data( 'result-column' ) ){
							$( target ).val( $( target ).data( 'result-row' ) );
						}
						else{
							$( target ).val( $( target ).data( 'result-row' ) + ' ' + me.__.column_indicator + ' ' + $( target ).data( 'result-column' ) + ' ' + me.__.row_indicator );
						}
					});
				}); 
			});
		},
		
		getOpposite: function( key ){ 
			return ( key.match( /^(row|column)-[0-9]+$/ )[1] == 'row' ? 'column' : 'row' ); // returns 'row' or 'column'
		},
		
		toFixed: function( number, settings ){
			if ( typeof number == 'string' ){
				return number;
			}
			else if ( isNaN( number ) ){
				return '';
			}
			else if ( number == 0 ){
				return '';
			}
			else{
				number = number.toFixed( settings.precision );
				if ( !settings.forced ){
					number = number.replace( /0+$/, '' ); // strip off trailing 0's
					number = number.replace( /\.$/, '' ); // if there are no decimal points to display, strip the decimal
				}
				return number;
			}
		},
		
		parseNum: function(_str){
			var c;
			var str = '' + _str;
			if (str.match(/^\(?[\$ -]?[0-9\,\.]+[km ]?\)?$/i)){ 	// parse number (including $10,000; 10K and 100.00)
				c = parseFloat(str.replace(/[\$,\(\) ]/g,''));
				if (str.match(/k$/i)) c = c * 1000;
				if (str.match(/m$/i)) c = c * 1000000;
				if (str.match(/^\(.*\)$/)) c = -1 * c;
				return c;
			}
			else if (str.length === 0){
				return 0;
			}
			else{
				return false;
			}
		},
		
		sum: function( inputs ){
			var sum = 0, error = false;
			inputs.each( function(){
				var value = me.parseNum( $(this).val() );
				if ( value === false )
					error = true;
				else
					sum+= value;
				
			});
			return error ? me.__.error : sum;
		},

		average: function( inputs ){
			var sum = me.sum( inputs );
			if ( sum == me.__.error ){
				return sum;
			}
			else{
				return sum / me.count( inputs );
			}
		},
		
		count: function( inputs ){
			return inputs.length;
		}
	});
	
	me.init();
})