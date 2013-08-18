
    	// Assumes GSM 03.38 (with extension)

    	// Based on the byte length, how many SMS Segments would this be
    	// based on the concatenated SMS rules.
    	// TODO Does this need to handle the case where a 7 bit char crosses a byte boundary
    	// TODO Assumes 140 bytes. Canada caps at 136 characters
	    function segments(bits, avg_char, errors) {
	    	var MAX_BITS = 140 * 8;
	    	var CONCAT_HEADER = 6 * 8; // in bits

	    	var segments = 1;
			if (bits > MAX_BITS) {
				segments = Math.ceil(bits / (MAX_BITS - CONCAT_HEADER));
			}	

			//var remaining = (((segments + 1) * MAX_BYTES) - bytes) / avg_char;
			var bytes = Math.ceil(bits / 8);
			var remaining = Math.floor((MAX_BITS - bits) / avg_char);
			return {
				bytes: bytes,
				remaining: remaining, // Remaining chars
				segments: segments,
				errors: errors
			};
	    }

		// 3GPP TS 23.038 / GSM 03.38
		var gsm = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
		var gsm_extended = "^{}\[~]|€";

	    function is_gsm(char) {
	    	return gsm.indexOf(char) !== -1;
	    }

	    function is_gsm_extended(char) {
	    	return gsm_extended.indexOf(char) !== -1;
	    }

	    function validate_gsm(text, extended) {

	    	var length = 0; // Length in bits
    		var errors = [];
    		extended = typeof extended !== 'undefined' ? extended : true;

    		for (var i = 0; i < text.length; i++) {
    			var c = text.charAt(i);
    			//console.log( text.charCodeAt(i) );

    			// Is valid GSM or GSM with extended?
    			if (is_gsm(c)) {
    				length += 7;
    			} else {
    				if (extended && is_gsm_extended(c)) {
    					length += 14; // For the ESC char + c
    				} else {
    					errors.push( {pos: i, char: c} );
    				}
    			}
    		}

    		return segments(length, 7, errors);
	    }

	    function is_ucs2(charCode) {
	    	return char < 0xFFFF;
	    }

	    function validate_ucs2(text) {

	    	var length = 0; // Length in bits
    		var errors = [];

    		for (var i = 0; i < text.length; i++) {
    			var c = text.charCodeAt(i);
    			if (is_ucs2(c)) {
    				length += 16;
    			} else {
    				errors.push( {pos: i, char: c} );
    			}
    		}

    		return segments(length, 16, errors);
	    }

	    function is_latin1(charCode) {
	    	return char < 0xFF;
	    }


	    function validate_latin1(text) {

	    	var length = 0; // Length in bits
    		var errors = [];

    		for (var i = 0; i < text.length; i++) {
    			var c = text.charCodeAt(i);
    			if (is_latin1(c)) {
    				length += 8;
    			} else {
    				errors.push( {pos: i, char: c} );
    			}
    		}

    		return segments(length, 8, errors);
	    }

//    			isoLength += 8;
//    			ucs2Length += 16;

    	function calculate(text) {
    		var nonGSM = "ç";

    		// Portico's SMSC accepts 7bit ASCII (in octets)
    		// AT&T requires we send in ISO Latin1 (8 bits) and they map to 7bit
    		// mBlox defaults to  Latin 1(ISO-8859-1) - They do NOT accept 7bit encodings
    		// Syniverse supports GSM 7bit by default, and optionally Latin-1
    		// Velti GSM 7bit or ISO
    		// SMSS GSM 7bit


			var gsm = validate_gsm(text, true);
			//var latin1 = validate_latin1(text);
			var ucs2 = validate_ucs2(text);

    		var obj = {
    			gsm: gsm,
    			//latin1: latin1,
    			ucs2: ucs2
    		}

    		console.log(obj);

    		/*
			var letter = 'a';
			var letterInAlfabet = gsm.indexOf(letter) !== -1;
			*/
			/*
			var s = encodeURIComponent('héllo');
			console.log(s);
			console.log(unescape(s));

			console.log($('#main').val().length);
			*/
    	}