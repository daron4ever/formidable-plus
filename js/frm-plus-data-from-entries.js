jQuery( function($){
	var me = FRM_PLUS_DATA_FROM_ENTRIES;
	$.extend( me, {
		init: function(){
			$.each( me.particulars, function( field_id, settings ){
				var table_selector = '#frm-table-' + field_id + ' ';
				if ( typeof settings.others != 'undefined' ){
					$.each( settings.others, function( selector, options ){
						$( table_selector ).on( 'change', '.' + selector + ' :input', {
							options: options,
							table_selector: table_selector
						}, function(e){
							var values = [], options = e.data.options, table_selector = e.data.table_selector;
							if ( $(this).is( 'input[type="checkbox"]' ) ){
								$(this).closest( 'td' ).find( 'input[type="checkbox"]:checked' ).each(function(){
									values.push( options.map[ $(this).val() ] );
								})
							}
							else if ( $(this).is( 'select' ) && $(this).prop( 'multiple') ){
								values = $(this).val();
							}
							else{
								values.push( options.map[ $(this).val() ] );
							}
							
							if ( options.target.match( /^row-[0-9]+$/ ) ){
								var column = $(this).closest( 'td' ).attr( 'class' ).match( /column-[0-9]+/ )[0];
								$( table_selector + '.' + options.target + ' .' + column  + ' input' ).val( values.join( ', ' ) );
							}
							else{
								var row = $(this).closest( 'tr' ).attr( 'class' ).match( /row-[0-9]+/ )[0];
								$( table_selector + '.' + row + ' .' + options.target  + ' input' ).val( values.join( ', ' ) );
							}
						})
					});
				}
			});
		}
	});
	
	me.init();
});