"enable examples";

export default class XML {
  
  // #CopiedFrom https://stackoverflow.com/questions/376373/pretty-printing-xml-with-javascript
  static prettify(sourceXml) {
    var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
    var xsltDoc = new DOMParser().parseFromString(
        // describes how we want to modify the XML - indent everything
        `<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
          <xsl:strip-space elements="*"/>
          <xsl:template match="para[content-style][not(text())]">
            <xsl:value-of select="normalize-space(.)"/>
          </xsl:template>
          <xsl:template match="node()|@*">
            <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>
          </xsl:template>
          <xsl:output indent="yes"/>
        </xsl:stylesheet>`, 'application/xml');

    var xsltProcessor = new XSLTProcessor();    
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
  }

}