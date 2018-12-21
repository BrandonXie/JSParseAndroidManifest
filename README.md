# JSParseAndroidManifest
JS parse AndroidManifest binary file

The Tool is used parse AndroidManifest binary file.

eg.
`
<body>
<input type='file' onchange='openFile(event)' accept=".apk">
<br/>
<br/>
<label id="label"></label>
</body>
<script src="./axml.js"></script>
<script src="./jszip.js"></script>
<script src="./jszip-utils.js"></script>
<script>
var openFile =function (event){
    var axml = new AXML(event,function(pkgName, versionName, versionCode){
        document.getElementById('label').innerHTML = "包名:        "+pkgName+"<br/>版本名称:  "+versionName+"<br/>版本号:     "+versionCode;
    });
}
</script>
`
