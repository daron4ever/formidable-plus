<?php ob_start(); ?>
<?php
// The value, if any, of this table cell
$value = '';
if ( isset( $field['value'] ) && is_array($field['value']) and array_key_exists($row_num,$field['value'])){
	if (is_array($field['value'][$row_num])){
		if (array_key_exists($col_num,$field['value'][$row_num])){
			$value = $field['value'][$row_num][$col_num];
		}
	}
	else{
		// This is the case only for radioline: types
		if ($display_only == true){
			$value = ($field['value'][$row_num] == $col_num ? FrmPlusFieldsHelper::get_simple_on_value() : '');
		}
		else{
			$value = $field['value'][$row_num];
		}
	}
} 	
?>
<?php 
if ( isset( $display_only ) && $display_only == true) {
	if (is_array($value)){
		echo implode(', ',$value);
	}
	elseif ($value == ''){
		echo '&nbsp;';
	}
	else{
		echo str_replace("\n","<br/>",$value);
	}
}
else {

	// FrmPlusFieldsHelper::parse_with_precedence takes two arguments
	//  - the first is the row title (i.e. textarea:My Row Name) (if there is one, null otherwise)
	//  - the second is the column title
	//  - it returns an array of ($type,$name,$options,$precedence), where: 
	//		$type is 'textarea','select',etc, , with precedence given of "anything trumps plain old text"
	//		$name is the name of the row or column
	//		$options are the options (not applicable for textare and text fields)
	//		$precedence is a string, either 'row' or 'column'
	list($type,$name,$options,$precedence) = FrmPlusFieldsHelper::parse_with_precedence((count($rows) ? $opt : null),$col_opt);
	$options = apply_filters('frmplus_field_options',$options,$field,$name,$row_num,$col_num); // Give filters the option of filtering on row/col or name of option or combination
	$this_field_id = "field_{$field['field_key']}_{$row_num}_{$col_num}";
	$this_field_name = sprintf( '%s[%s]', $field_name, $row_num );
	if ( !isset( $options['options'] ) ){
		$options['options'] = array();
	}
	
	switch($type){ 
	case 'textarea':
		echo '<textarea id="'.$this_field_id.'" name="'.$this_field_name.'['.$col_num.']" class="auto_width table-cell">'.htmlspecialchars($value).'</textarea>'."\n";
		break;
	case 'radio':
		if (count($options['options'])){
			foreach($options['options'] as $option_num => $option){
				echo '<input type="radio" class="radio table-cell id-has-option" id="'.$this_field_id.'_'.$option_num.'" name="'.$this_field_name.'['.$col_num.']" value="'.esc_attr($option).'" '.checked($value,$option,false).' /><label for="'.$this_field_id.'_'.$option_num.'">'.$option.'</label>'."\n";
			}
		}
		else{
			echo '<input type="radio" class="radio table-cell" id="'.$this_field_id.'" name="'.$this_field_name.'['.$col_num.']" value="'.esc_attr(FrmPlusFieldsHelper::get_simple_on_value()).'" '.checked($value,FrmPlusFieldsHelper::get_simple_on_value(),false).' />'."\n";
		}
		break;
	case 'radioline':
		switch ($precedence){
		case 'row':
			// This is a row of radio buttons, grouped together (so selecting one column deselects all others)
			$option_value = $col_num;
			echo '<input type="radio" class="radio table-cell" id="'.$this_field_id.'" name="'.$this_field_name.'" value="'.esc_attr($option_value).'" '.checked($value,FrmPlusFieldsHelper::get_simple_on_value(),false).' />'."\n";
			break;
		case 'column':
			// This is a column of radio buttons, grouped together (so selecting one row deselects all others)
			$option_value = $row_num;
			echo '<input type="radio" class="radio radioline-transpose" id="'.$this_field_id.'" name="'.$field_name.'[transpose]['.$col_num.']" value="'.esc_attr($option_value).'" '.checked($value,FrmPlusFieldsHelper::get_simple_on_value(),false).' />'."\n";
			break;
		}
		break;
	case 'select':
		if ( isset( $options['multiselect'] ) && $options['multiselect'] )
			$multiple = 'multiple data-placeholder=" "';
		else
			$multiple = '';
		
		if ( isset( $options['autocom'] ) && $options['autocom'] ){
	        global $frm_vars;
	        $frm_vars['chosen_loaded'] = true;
			$frm_chzn = 'frm_chzn';
		}
		else{
			$options['autocom'] = false;
			$frm_chzn = '';
		}
		echo "<select id=\"$this_field_id\" $multiple name=\"{$this_field_name}[$col_num]\" class=\"table-cell $frm_chzn\">\n";
		if ( !$multiple ){
			echo '<option value="" '.selected($value,'',false).'>&nbsp;</option>'."\n";
		}
		foreach ($options['options'] as $option){
			echo '<option value="'.esc_attr($option).'" '.selected($value,$option,false).'>'.$option.'</option>'."\n";
		}
		echo '</select>'."\n";
		break;
	case 'checkbox':
		if (count($options['options'])){
			foreach ($options['options'] as $option_num => $option){
				echo '<input type="checkbox" id="'.$this_field_id.'_'.$option_num.'" name="'.$this_field_name.'['.$col_num.'][]" class="checkbox table-cell id-has-option" value="'.esc_attr($option).'" '.checked(in_array($option,(array)$value),true,false).' /><label for="'.$this_field_id.'_'.$option_num.'">'.$option.'</label>'."\n";
			}
		}
		else{
			echo '<input type="checkbox" class="checkbox table-cell" id="'.$this_field_id.'" name="'.$this_field_name.'['.$col_num.']" value="'.esc_attr(FrmPlusFieldsHelper::get_simple_on_value()).'" '.checked($value,FrmPlusFieldsHelper::get_simple_on_value(),false).' />'."\n";
		}
		break;
	default:
		if ( has_action( 'frmplus_field_input_' . $type  ) ){
			do_action( 'frmplus_field_input_' . $type, compact( 'field', 'name', 'value', 'options', 'row_num', 'col_num', 'this_field_id', 'this_field_name', 'precedence', 'entry_id' ) );
		}
		else{
			echo '<input type="text" size="10" id="'.$this_field_id.'" name="'.$this_field_name.'['.$col_num.']" value="'.esc_attr($value).'" class="auto_width table-cell" />'."\n";
		}
		break;
	}
	
	// Massaging might need to happen.  Let's see if we need to book a massage
	global $frmplus_fields_helper;
	$frmplus_fields_helper->maybe_book_massage($field['id'],$type,$precedence,($precedence == 'column' ? $col_num : $row_num));
}
?>
<?php 
	$_o = ob_get_clean(); 
	// On large multipage forms, I was running into an issue where page 2+ was taking forever to render.
	// I scratched my head on it for a long time, and finally figured out that it's because the field names here
	// contain [ and ].  My best guess is that the result of this output then gets sent through replace_shortcodes
	// which just grinds and grinds on each of the fields, taking forever.  It we use the HTML entity codes instead
	// then all seems well.  Gyarr.
	$_o = str_replace( array('[',']'),array('&#91;','&#93;'), $_o );
	
	echo apply_filters('table_field_'.$field['field_key'],$_o,$field,$row_num,$col_num); 
?>
