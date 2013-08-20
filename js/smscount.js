(function(root) {
    "use strict";

    var SEGMENT_LENGTH = 140 * 8;
    var UDH_LENGTH     =   6 * 8; // in bits

    /*
    1   160
    2   306
    3   459
    4 (Maximum) 612
    */

    // 3GPP TS 23.038 / GSM 03.38
    var gsm = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
    var gsm_extended = "^{}\\[~]|€";

    function is_gsm(c) {
        return gsm.indexOf(c) !== -1;
    }

    function is_gsm_extended(c) {
        return gsm_extended.indexOf(c) !== -1;
    }

    function is_ucs2(c) {
        return c.charCodeAt(0) < 0xFFFF;
    }

    function is_latin1(c) {
        return c.charCodeAt(0) < 0xFF;
    }

	// Based on the byte length, how many SMS Segments would this be
	// based on the concatenated SMS rules.
	// TODO Does this need to handle the case where a 7 bit char crosses a byte boundary
	// TODO Assumes 140 bytes. Canada caps at 136 characters
	function segments(bits, avg_char, errors) {

        var bytes = Math.ceil(bits / 8);

        var next_segment = SEGMENT_LENGTH; // Boundary of next segment
    	var segments = 1;
		if (bits > SEGMENT_LENGTH) {
            var segment_length_with_udh = SEGMENT_LENGTH - UDH_LENGTH;
			segments = Math.ceil(bits / segment_length_with_udh);
            next_segment = segments * segment_length_with_udh;
		}

		var remaining = Math.floor((next_segment - bits) / avg_char);
		return {
			bytes: bytes,         // Total bytes
			remaining: remaining, // Remaining chars
            est_remaining: remaining, // Remaining chars (estimating size of error chars)
			segments: segments,   // Total SMS Segments
			errors: errors        // Array of errored chars
		};
    }

    function validate_gsm(text, extended) {

    	var length = 0; // Length in bits
		var errors = [];
		extended = typeof extended !== 'undefined' ? extended : true;

		for (var i = 0; i < text.length; i++) {
			var c = text.charAt(i);

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

    function validate_ucs2(text) {

    	var length = 0; // Length in bits
		var errors = [];

		for (var i = 0; i < text.length; i++) {
            var c = text.charAt(i);
			if (is_ucs2(c)) {
				length += 16;
			} else {
				errors.push( {pos: i, char: c} );
			}
		}

		return segments(length, 16, errors);
    }

    function validate_latin1(text) {

    	var length = 0; // Length in bits
		var errors = [];

		for (var i = 0; i < text.length; i++) {
			var c = text.charAt(i);
			if (is_latin1(c)) {
				length += 8;
			} else {
				errors.push( {pos: i, char: c} );
			}
		}

		return segments(length, 8, errors);
    }

    var encodings = {
        gsm : {
            name: "GSM",
            avg_size: 7,
            validator: function(v) { 
                return validate_gsm(v, false);
            }
        },
        gsm_e : {
            name: "GSM extended",
            avg_size: 7,
            validator: validate_gsm
        },
        latin1 : {
            name: "ISO-8859-1 (latin1)",
            avg_size: 8,
            validator: validate_latin1
        },
        usc2 : {
            name: "USC-2",
            avg_size: 16,
            validator: validate_ucs2
        },
    };

    root.SMS = {
        encodings: encodings,

        is_gsm : is_gsm,
        is_gsm_extended : is_gsm_extended,
        is_ucs2 : is_ucs2,
        is_latin1 : is_latin1,

        segments : segments,
        validate_gsm : validate_gsm,
        validate_ucs2 : validate_ucs2,
        validate_latin1 : validate_latin1,

        validate : function(encoding, text) {
            var encoding = this.encodings[encoding];
            return encoding.validator(text);
        }
    };

})(this);