function AXML(event,callback) {

    var ATTRIBUTE_IX_NAMESPACE_URI  = 0;
    var ATTRIBUTE_IX_NAME           = 1;
    var ATTRIBUTE_IX_VALUE_STRING   = 2;
    var ATTRIBUTE_IX_VALUE_TYPE     = 3;
    var ATTRIBUTE_IX_VALUE_DATA     = 4;
    var ATTRIBUTE_LENGHT            = 5;
    
    var START_DOCUMENT              = 0;
    var END_DOCUMENT                  = 1;
    var START_TAG                            = 2;
    var END_TAG                                = 3;
    var TEXT                                        = 4;
    
    var CHUNK_AXML_FILE             = 0x00080003;
    var CHUNK_RESOURCEIDS           = 0x00080180;
    var CHUNK_XML_FIRST             = 0x00100100;
    var CHUNK_XML_START_NAMESPACE   = 0x00100100;
    var CHUNK_XML_END_NAMESPACE     = 0x00100101;
    var CHUNK_XML_START_TAG         = 0x00100102;
    var CHUNK_XML_END_TAG           = 0x00100103;
    var CHUNK_XML_TEXT              = 0x00100104;
    var CHUNK_XML_LAST              = 0x00100104;
    
    var TYPE_ATTRIBUTE          = 2;
    var TYPE_DIMENSION          = 5;
    var TYPE_FIRST_COLOR_INT    = 28;
    var TYPE_FIRST_INT          = 16;
    var TYPE_FLOAT              = 4;
    var TYPE_FRACTION           = 6;
    var TYPE_INT_BOOLEAN        = 18;
    var TYPE_INT_COLOR_ARGB4    = 30;
    var TYPE_INT_COLOR_ARGB8    = 28;
    var TYPE_INT_COLOR_RGB4     = 31;
    var TYPE_INT_COLOR_RGB8     = 29;
    var TYPE_INT_DEC            = 16;
    var TYPE_INT_HEX            = 17;
    var TYPE_LAST_COLOR_INT     = 31;
    var TYPE_LAST_INT           = 31;
    
    var TYPE_NULL               = 0;
    var TYPE_REFERENCE          = 1;
    var TYPE_STRING             = 3;
    var RADIX_MULTS             =   [ 0.00390625, 3.051758E-005, 1.192093E-007, 4.656613E-010 ];
    var DIMENSION_UNITS         =   [ "px","dip","sp","pt","in","mm","","" ];
    var FRACTION_UNITS          =   [ "%","%p","","","","","","" ];
    var COMPLEX_UNIT_MASK        =   15;
    
	var stringContentList = [];

	var input = event.target;
    var reader = new FileReader();
    reader.readAsArrayBuffer(input.files[0]);
    reader.onload = function () {

    	var new_zip = new JSZip();
    	new_zip.loadAsync(reader.result).then(function (zip) {
    		new_zip.file("AndroidManifest.xml").async("arraybuffer").then(function (arrayBuffer) {
                 var axml = new AXMLParser(arrayBuffer);
                 
                var buff = "";
                var pkgName,versionName,versionCode;
                 while(true){
                    var _type = axml.next();

                    if(_type == START_DOCUMENT){
                        buff += '<?xml version="1.0" encoding="utf-8"?>\n';
                    }else if(_type ==  START_TAG){
                        buff += '<' + getPrefix(axml.getPrefix()) + axml.getName() + '\n';
                        buff += axml.getXMLNS();
                        for (var i = 0; i <axml.getAttributeCount();i++){
                            var attributeName = axml.getAttributeName(i);
                            var attributeValue = _escape( getAttributeValue(axml,  i ));
                            buff += getPrefix(axml.getAttributePrefix(i) )+attributeName+"=\""+attributeValue +"\"\n";
                            if(attributeName == "versionName"){
                                versionName= attributeValue;
                            }else if(attributeName == "versionCode"){
                                versionCode = attributeValue;
                            }else if(attributeName == "package"){
                                pkgName = attributeValue;
                            }
                        }
                        buff += '>\n';
                    } else if(_type == END_TAG){
                        buff += "</"+getPrefix( axml.getPrefix() )+axml.getName() +">\n";
                     } else if(_type ==  TEXT){
                        self.buff += axml.getText()+"\n";
                     } else if(_type ==  END_DOCUMENT){
                        break;
                    }
                    
                 }
                //console.log(buff);
                callback(pkgName,versionName,versionCode );
    		});
    	});
    }
    function _escape(s){
        if(s == undefined){
            return "undefinedEscape";
        }
        s = s.replace("&", "&");
        s = s.replace('"', "'");
        s = s.replace("'", "'");
        s = s.replace("<", "<");
        s = s.replace(">", ">");
        return escape(s);
    }
     function getPrefix(prefix){
        if(prefix == undefined || prefix == null || prefix == ""){
            return "";
        }
        return prefix + ":";
     }
     
    function getAttributeValue(axml, index){
        var _type = axml.getAttributeValueType(index);
        var _data = axml.getAttributeValueData(index);
        switch(_type){
            case TYPE_STRING:
                return axml.getAttributeValue(index);
                break;
            case TYPE_ATTRIBUTE:
                return `?${getPackage(_data)}${_data.toString(16)}`;
                //return "?%s%08X" % (getPackage(_data), );
                break;
            case TYPE_REFERENCE:
                return `?${getPackage(_data)}${_data.toString(16)}`;
                //return "?%s%08X" % (getPackage(_data), _data);
                break;
            case TYPE_FLOAT:
                return "float";
                //return "%f" % unpack("=f", pack("=L", _data))[0];
                break;
            case TYPE_INT_HEX:
                return `0x${_data.toString(16)}`;
                //return "0x%08X" % _data;
                break;
            case TYPE_INT_BOOLEAN:
                if (_data == 0){
                    return "false";
                }
                return "true";
                break;
            case TYPE_DIMENSION:
                return "" + this.complexToFloat(_data)+DIMENSION_UNITS[_data & COMPLEX_UNIT_MASK];
                break;
            case TYPE_FRACTION:
                return "" + this.complexToFloat(_data) + FRACTION_UNITS[_data & COMPLEX_UNIT_MASK];
                break;
        }
        if(_type >= TYPE_FIRST_COLOR_INT && _type <= TYPE_LAST_COLOR_INT){
            return `#${_data.toString(16)}`;
        }else if(_type >= TYPE_FIRST_INT && _type <= TYPE_LAST_INT){
            return "" +_data;
        }
        return `<0x${_data.toString(16)}, type 0x${_type.toString(16)}>`;
    }
    
    function complexToFloat(xcomplex){
        return (xcomplex & 0xFFFFFF00) * RADIX_MULTS[(xcomplex >> 4) & 3];
    }
        
    function getPackage(id){
        if (id >> 24 == 1){
            return "android:";
        }
        return "";
    }


    var byteOffset = 0;
    function AXMLParser(arrayBuffer) {

    	var m_event = -1;
    	var m_lineNumber = -1;
    	var m_name = -1;
    	var m_namespaceUri = -1;
    	var m_attributes = [];
    	var m_idAttribute = -1;
    	var m_classAttribute = -1;
    	var m_styleAttribute = -1;

    	var view = new DataView(arrayBuffer);
    	var xmlMagic = view.getUint32(0, true);
        byteOffset += 4;

    	var xmlSize = view.getUint32(4, true);
        byteOffset +=4;

    	var sb =new StringBlock(view);
        
    	var m_resourceIDs = [];
    	var m_prefixuri = {};
    	var m_uriprefix = {};
    	var m_prefixuriL = [];
    	var visited_ns = [];

    	this.reset = function () {
    		m_event = -1;
    		m_lineNumber = -1;
    		m_name = -1;
    		m_namespaceUri = -1;
    		m_attributes = [];
    		m_idAttribute = -1;
    		m_classAttribute = -1;
    		m_styleAttribute = -1;
    	}
    	this.next = function(){
            this.doNext();
            return m_event;
        }
    	this.doNext = function () {
    		if (m_event == END_DOCUMENT){
                return;
            }
            var event = m_event;
            this.reset();
            while(true){
                var chunkType = -1;
    			 // Fake END_DOCUMENT event.
                if(event == END_TAG){
                    //pass
                }
    			if(event == START_DOCUMENT){
                	chunkType = CHUNK_XML_START_TAG;
                }else {
                    if(byteOffset >= view.byteLength){
                        m_event = END_DOCUMENT;
                        break;
                    }
                    chunkType = view.getUint32(byteOffset, true);
                    byteOffset += 4;
                }
                if(chunkType == CHUNK_RESOURCEIDS){
                    var chunkSize = view.getUint32(byteOffset, true);
                    byteOffset += 4;
                    if(chunkSize < 8 || chunkSize % 4 != 0){
                        console.log("chunkSize ooo");
                    }
                    for(var i=0; i < (chunkSize /4) -2;i++){
                        m_resourceIDs.push(view.getUint32(byteOffset, true));
                        byteOffset += 4;
                    }
                    continue;
                }
                if (chunkType < CHUNK_XML_FIRST || chunkType > CHUNK_XML_LAST){
                    console.log("chunkType ooo");
                }

                if (chunkType == CHUNK_XML_START_TAG){
                }
                if (chunkType == CHUNK_XML_START_TAG && event == -1){
                    m_event = START_DOCUMENT;
                    break;
                }
                byteOffset +=4;/*chunkSize*/
                
                var lineNumber = view.getUint32(byteOffset, true);
                byteOffset +=4;
                
                 byteOffset +=4;/*0xFFFFFFFF*/

                if(chunkType == CHUNK_XML_START_NAMESPACE || chunkType == CHUNK_XML_END_NAMESPACE){
                    if(chunkType == CHUNK_XML_START_NAMESPACE){
                        var prefix =view.getUint32(byteOffset, true);
                        byteOffset +=4;
                        
                        var uri = view.getUint32(byteOffset, true);
                         byteOffset +=4;
                         m_prefixuri[prefix] = uri;
                        m_uriprefix[uri] = prefix;
                        m_prefixuriL.push([prefix, uri]);
                        ns = uri ;
                    }else{
                        ns = -1;
                        byteOffset +=4;
                        byteOffset +=4;
                        var prefix_uri = m_prefixuriL.pop();
                    }
                    continue;
                }
                m_lineNumber = lineNumber;

                if(chunkType == CHUNK_XML_START_TAG){
                    m_namespaceUri = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    m_name = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    
                    byteOffset +=4;// flags
                    
                    var attributeCount = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    
                    m_idAttribute = (attributeCount >> 16) - 1;
                    attributeCount = attributeCount & 0xFFFF;
                    m_classAttribute = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    m_styleAttribute = (m_classAttribute >> 16) - 1;
                    m_classAttribute = (m_classAttribute & 0xFFFF) - 1;
                    
                    for (var i = 0; i< attributeCount * ATTRIBUTE_LENGHT; i++){
                        m_attributes.push(view.getUint32(byteOffset, true));
                         byteOffset +=4;
                    }
                    for (var i = ATTRIBUTE_IX_VALUE_TYPE; i< m_attributes.length; ){
                        m_attributes[i] = m_attributes[i] >> 24;
                        i += ATTRIBUTE_LENGHT;
                    }
                    m_event = START_TAG;
                    break
                }
                if(chunkType == CHUNK_XML_END_TAG){
                    m_namespaceUri = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    m_name = view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    m_event = END_TAG;
                    break;
                }

                if(chunkType == CHUNK_XML_TEXT){
                    m_name =  view.getUint32(byteOffset, true);
                    byteOffset +=4;
                    
                    byteOffset +=4;
                    byteOffset +=4;
                    
                    m_event = TEXT
                    break
                }
            }
    	}
        this.getPrefixByUri = function(uri){
            if(m_uriprefix[uri] != undefined){
                return m_uriprefix[uri];
            }else{
                return -1;
            }
        }
        this.getPrefix = function(){
            if(m_uriprefix[m_namespaceUri] != undefined){
                return sb.getRaw(m_uriprefix[m_namespaceUri]);
            }else{
                return "";
            }
        }
        this.getName = function(){
            if(m_name == -1 || (m_event != START_TAG && m_event != END_TAG)){
                return "";
            }
            return sb.getRaw(m_name);
        }
        this.getText = function(){
            if(m_name == -1 || m_event != TEXT){
                return "";
            }
            return sb.getRaw(m_name);
        }
        this.getNamespacePrefix = function(pos){
            prefix = m_prefixuriL[pos][0];
            return sb.getRaw(prefix);
        }
        this.getNamespaceUri = function(pos){
            uri = m_prefixuriL[pos][1]
            return sb.getRaw(uri)
        }
        this.getXMLNS = function(){
         var buff = "";
        for (i in m_uriprefix){
            if(visited_ns.indexOf(i) == -1){
                buff += "xmlns:"+sb.getRaw(m_uriprefix[i])+"=\""+sb.getRaw(m_prefixuri[m_uriprefix[i]])+"\"\n";
                visited_ns.push(i);
            }
        }
        return buff;
        }

        this.getNamespaceCount = function(pos){
        }

    	this.getAttributeOffset = function(index){
            if(m_event != START_TAG){
                console.log("Current event is not START_TAG.");
            }
            var offset = index * 5;
            if(offset >= m_attributes.length){
                console.log("Invalid attribute index");
            }
            return offset;
        }


    	this.getAttributeCount = function(){
            if(m_event != START_TAG){
                return -1;
            }
            return parseInt(m_attributes.length / ATTRIBUTE_LENGHT);
        }
    	this.getAttributePrefix = function(index){
            var offset = this.getAttributeOffset(index);
            var uri = m_attributes[offset + ATTRIBUTE_IX_NAMESPACE_URI];
            var prefix = this.getPrefixByUri(uri);
    
            if(prefix == -1){
                return "";
            }
            return sb.getRaw(prefix);
        }


    	this.getAttributeName = function(index){
            var offset = this.getAttributeOffset(index);
            var name = m_attributes[offset + ATTRIBUTE_IX_NAME];
    
            if(name == -1){
                        return "";
                }
        return sb.getRaw(name);
        }


    	this.getAttributeValueType = function(index){
            var offset = this.getAttributeOffset(index);
            return m_attributes[offset + ATTRIBUTE_IX_VALUE_TYPE];
        }

    	this.getAttributeValueData = function( index){
            	var offset = this.getAttributeOffset(index);
            return m_attributes[offset + ATTRIBUTE_IX_VALUE_DATA];
        }

    	this.getAttributeValue = function( index){
            var offset = this.getAttributeOffset(index);
            var valueType = m_attributes[offset + ATTRIBUTE_IX_VALUE_TYPE];
            if(valueType == TYPE_STRING){
                	valueString = m_attributes[offset + ATTRIBUTE_IX_VALUE_STRING];
                    return sb.getRaw(valueString);
            }
            return "";
    	// int valueData = m_attributes[offset + ATTRIBUTE_IX_VALUE_DATA];
    	 // return TypedValue.coerceToString(valueType, valueData);
        }
    }
    
    function StringBlock(view) {
    	console.log("view length:" + view.byteLength + ",byteOffset:" + view.byteOffset);
    	var _cache = {};

    	var header = view.getInt16(byteOffset, true);
    	byteOffset += 2;

    	var headerSize = view.getInt16(byteOffset, true);
    	byteOffset += 2;
    	var chunkSize = view.getUint32(byteOffset, true);
    	byteOffset += 4;

    	var stringCount = view.getUint32(byteOffset, true);
    	byteOffset += 4;

    	var styleOffsetCount = view.getUint32(byteOffset, true);
    	byteOffset += 4;

    	var UTF8_FLAG = 0x00000100;
    	var flags = view.getUint32(byteOffset, true);
    	byteOffset += 4;
    	var m_isUTF8 = ((flags & UTF8_FLAG) != 0);
    	console.log("isUTF8:" + m_isUTF8);

    	var stringsOffset = view.getUint32(byteOffset, true);
    	byteOffset += 4;
    	var stylesOffset = view.getUint32(byteOffset, true);
    	byteOffset += 4;

    	var m_stringOffsets = [];
    	var m_styleOffsets = [];
    	var m_strings = [];
    	var m_styles = [];

    	for (var i = 0; i < stringCount; i++) {
    		m_stringOffsets.push(view.getUint32(byteOffset, true));
    		byteOffset += 4;
    	}

    	for (var i = 0; i < styleOffsetCount; i++) {
    		m_styleOffsets.push(view.getUint32(byteOffset, true));
    		byteOffset += 4;
    	}

    	var size = chunkSize - stringsOffset;
    	if (stylesOffset != 0) {
    		size = stylesOffset - stringsOffset
    	}
    	if ((size % 4) != 0) {
    		console.log("stringsOffset size ooo");
    	}
    	for (var i = 0; i < size; i++) {
    		m_strings.push(view.getUint8(byteOffset, true));
    		byteOffset += 1;
    	}

    	if (stylesOffset != 0) {
    		size = chunkSize - stylesOffset;
    	
            if ((size % 4) != 0) {
                console.log("stylesOffset size ooo");
            }
    
            for (var i = 0; i < size / 4; i++) {
                m_styles.push(view.getUint32(byteOffset, true));
                byteOffset += 4;
            }
            console.log("m_styles length: " + m_styles.length);
        }

    	this.getRaw = function (idx) {
    		if (_cache.hasOwnProperty(idx)) {
    			return _cache[idx];
    		}
    		if (idx < 0 || m_stringOffsets === undefined || m_stringOffsets.length == 0 || idx >= m_stringOffsets.length) {
    			return "";
    		}
    		var offset = m_stringOffsets[idx];

    		if (!m_isUTF8) {
    			var length = this.getShort2(m_strings, offset);
    			offset += 2;
    			_cache[idx] = this.decode(m_strings, offset, length);
    		} else {
    			offset += this.getVarint(m_strings, offset)[1];
    			var varint = this.getVarint(m_strings, offset);
                
    			offset += varint[1];
    			var length = varint[0];
    			_cache[idx] = this.decode2(m_strings, offset, length);
    		}
    		return _cache[idx];
    	}

    	this.decode = function (array, offset, length) {
    		length = length * 2;
    		length = length + length % 2;
    		var data = [];
    		for (var i=0; i < length; i++) {
    			data.push(array[offset + i]);
    			//"\x00\x00"则结束
    			if (data[data.length - 1] == 0 && data[data.length - 2] == 0) {
    				break;
    			}
    		}
    		//去除"\x00\x00"
    		if (data[data.length - 1] == 0 && data[data.length - 2] == 0) {
    			data.pop();
    			data.pop();
    		}
    		return byte2UTF16Str(data);
    	}
        
        function byte2UTF16Str(data) { 
            var bufView = new Uint8Array(data.length);
            for(var i = 0;i <data.length;i++){
                bufView[i] = data[i];
            }
            return String.fromCharCode.apply(null, new Uint16Array(bufView.buffer));
        }


    	this.decode2 = function (array, offset, length) {
    		var data = [];
    		for (var i = 0; i < length; i++) {
    			data.push(array[offset + i]);
    		}
    		return String.fromCharCode.apply(String, data);
    	}        
        
    	this.getVarint = function (array, offset) {
    		var result = new Array(2);
    		var more = (array[offset] & 0x80) != 0;
    		result[0] = array[offset] & 0x7f;
    		if (!more) {
    			result[1] = 1;
    			return result;
    		}
    		result[0] = array[offset] << 8 | array[offset + 1] & 0xff;
    		result[1] = 2;
    		return result;
    	}

    	this.getShort = function (array, offset) {
    		var value = array[offset / 4];
    		if (((offset % 4) / 2)== 0) {
    				return value & 0xFFFF;
    			}
    		else {
    			return value >> 16;
    		}
    	}

    	this.getShort2 = function (array, offset) {
    		return (array[offset + 1] & 0xff) << 8 | array[offset] & 0xff;
    	}
    }
    };