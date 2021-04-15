## 2020-11-06
*Author: @onsetsu*

TAF TAP TSI -> irgendwas mit Trassenbestellung ;)

---

## Code zur Tabellengenerierung

```JS
// wir gehen von einem lively-code-mirror aus, der die Daten hält
const csv = document.body.querySelector('#csv').value;
csv;

const lines = csv.split('\n');
function getNameFromLine(line) {
  return line.replace(/;/mg, '');
}
var elementNames = lines.map(getNameFromLine).uniq();

var mapping = new Map();
elementNames.forEach(en => mapping.set(en, []));

function numStartingColons(str) {
  var index = 0;
  while (str[index] === ';') {
    index++;
  }
  return index;
}

var currents = [];
lines.forEach(line => {
  var name = getNameFromLine(line);
  var depth = numStartingColons(line);
  currents.length = depth;

  if (depth > 0) {
    const children = mapping.get(currents[currents.length - 1]);
    children.push(name);
  }

  currents[depth] = name;
});

mapping;

function hasChildren(name) {
  var children = mapping.get(name);
  return children.length > 0;
}
elementNames.filter(hasChildren).map(name => {
  var children = mapping.get(name);

  var header = `<h4><span>${name}</span></h4>`;

  if (children.length === 0) {
    return header;
  }

  var listTableContent = children.map(child => `
        <tr>
          <td colspan="1">
            ${hasChildren(child) ? `<ac:link ac:anchor="${child}"/>` : `<span>${child}</span>`}
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
        </tr>`).join(``);
  return `${header}
    <table class="wrapped">
      <colgroup>
        <col/>
        <col/>
        <col/>
        <col/>
        <col/>
        <col/>
      </colgroup>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Kardinalität</th>
          <th>Typ</th>
          <th>Datenlänge</th>
          <th>Beispiel</th>
          <th>Bemerkung</th>
        </tr>
        ${listTableContent}
      </tbody>
    </table>`;
}).join(`

`);
```

## Eingabe CSV

<pre>
MessageHeader;;;;;;;;;;;;;;;;
;MessageReference;;;;;;;;;;;;;;;
;;MessageType;;;;;;;;;;;;;;
;;MessageTypeVersion;;;;;;;;;;;;;;
;;MessageIdentifier;;;;;;;;;;;;;;
;;MessageDateTime;;;;;;;;;;;;;;
;MessageRoutingID;;;;;;;;;;;;;;;
;SenderReference;;;;;;;;;;;;;;;
;Sender;;;;;;;;;;;;;;;
;;CI_InstanceNumber;;;;;;;;;;;;;;
;Recipient;;;;;;;;;;;;;;;
;;CI_InstanceNumber;;;;;;;;;;;;;;
AdministrativeContactInformation;;;;;;;;;;;;;;;;
;Name;;;;;;;;;;;;;;;
;Address;;;;;;;;;;;;;;;
;eMail;;;;;;;;;;;;;;;
;PhoneNumber;;;;;;;;;;;;;;;
;FaxNumber;;;;;;;;;;;;;;;
;FreeTextField;;;;;;;;;;;;;;;
Identifiers;;;;;;;;;;;;;;;;
;PlannedTransportIdentifiers;;;;;;;;;;;;;;;
;;ObjectType;;;;;;;;;;;;;;
;;Company;;;;;;;;;;;;;;
;;Core;;;;;;;;;;;;;;
;;Variant;;;;;;;;;;;;;;
;;TimetableYear;;;;;;;;;;;;;;
;;StartDate;;;;;;;;;;;;;;
;RelatedPlannedTransportIdentifiers*;;;;;;;;;;;;;;;
MessageStatus;;;;;;;;;;;;;;;;
TypeOfRUHarmonization;;;;;;;;;;;;;;;;
TypeOfIMHarmonization;;;;;;;;;;;;;;;;
CoordinatingIM;;;;;;;;;;;;;;;;
LeadRU;;;;;;;;;;;;;;;;
TypeOfRequest;;;;;;;;;;;;;;;;
TypeOfInformation;;;;;;;;;;;;;;;;
TrainInformation;;;;;;;;;;;;;;;;
;PlannedJourneyLocation*;;;;;;;;;;;;;;;
;PlannedCalendar*;;;;;;;;;;;;;;;
;PathPlanningReferenceLocation;;;;;;;;;;;;;;;
;;CountryCodeISO;;;;;;;;;;;;;;
;;LocationPrimaryCode;;;;;;;;;;;;;;
;;PrimaryLocationName;;;;;;;;;;;;;;
;;LocationSubsidiaryIdentification*;;;;;;;;;;;;;;
PathInformation;;;;;;;;;;;;;;;;
;PlannedJourneyLocation;;;;;;;;;;;;;;;
;;JorneyLocationTypeCode;;;;;;;;;;;;;;
;;CountryCodeISO;;;;;;;;;;;;;;
;;LocationPrimaryCode;;;;;;;;;;;;;;
;;PrimaryLocationName;;;;;;;;;;;;;;
;;LocationSubsidiaryIdentification;;;;;;;;;;;;;;
;;;LocationSubsidiaryCode;;;;;;;;;;;;;
;;;;LocationSubsidiaryTypeCode;;;;;;;;;;;;
;;;AllocationCompany;;;;;;;;;;;;;
;;;LocationSubsidiaryName;;;;;;;;;;;;;
;;TimingAtLocation;;;;;;;;;;;;;;
;;;Timing;;;;;;;;;;;;;
;;;;TimingQualifierCode;;;;;;;;;;;;
;;;;Time;;;;;;;;;;;;
;;;;Offset;;;;;;;;;;;;
;;;;BookedLocationDateTime;;;;;;;;;;;;
;;;DwellTime;;;;;;;;;;;;;
;;FreeTextField;;;;;;;;;;;;;;
;;ResponsibleApplicant;;;;;;;;;;;;;;
;;ResponsibleRU;;;;;;;;;;;;;;
;;ResponsibleIM;;;;;;;;;;;;;;
;;PlannedTrainData;;;;;;;;;;;;;;
;;;TrainType;;;;;;;;;;;;;
;;;TrafficType;;;;;;;;;;;;;
;;;TypeOfService;;;;;;;;;;;;;
;;;;SpecialServiceDescriptionCode;;;;;;;;;;;;
;;;;FacilityTypeDescriptionCode;;;;;;;;;;;;
;;;;CharacteristicDescriptionCode;;;;;;;;;;;;
;;;CommercialTrafficType;;;;;;;;;;;;;
;;;PlannedTrainTechnicalData;;;;;;;;;;;;;
;;;;TrainWeight;;;;;;;;;;;;
;;;;TrainLength;;;;;;;;;;;;
;;;;WeightOfSetOfCarriages;;;;;;;;;;;;
;;;;LengthOfSetOfCarriages;;;;;;;;;;;;
;;;;TractionDetails;;;;;;;;;;;;
;;;;;LocoTypeNumber;;;;;;;;;;;
;;;;;;TypeCode1;;;;;;;;;;
;;;;;;TypeCode2;;;;;;;;;;
;;;;;;CountryCode;;;;;;;;;;
;;;;;;SeriesNumber;;;;;;;;;;
;;;;;;SerialNumber;;;;;;;;;;
;;;;;;ControlDigit;;;;;;;;;;
;;;;;TractionMode;;;;;;;;;;;
;;;;;TrainCC_System;;;;;;;;;;;
;;;;;TrainRadioSystem;;;;;;;;;;;
;;;;;TractionWeight;;;;;;;;;;;
;;;;;Length;;;;;;;;;;;
;;;;;;Value;;;;;;;;;;
;;;;;;Measure;;;;;;;;;;
;;;;TrainMaxSpeed;;;;;;;;;;;;
;;;;HighestPlannedSpeed;;;;;;;;;;;;
;;;;MaxAxleWeight;;;;;;;;;;;;
;;;;RouteClass;;;;;;;;;;;;
;;;;BrakeType;;;;;;;;;;;;
;;;;EmergencyBrakeOverride;;;;;;;;;;;;
;;;;BrakeRatio;;;;;;;;;;;;
;;;;MinBrakedWeightPercent;;;;;;;;;;;;
;;;;BrakeWeight;;;;;;;;;;;;
;;;ExceptionalGaugingIdent;;;;;;;;;;;;;
;;;;IM_Partner;;;;;;;;;;;;
;;;;ExceptionalGaugingCode;;;;;;;;;;;;
;;;DangerousGoodsIndication;;;;;;;;;;;;;
;;;;HazardIdentificationNumber;;;;;;;;;;;;
;;;;UN_Number;;;;;;;;;;;;
;;;;Danger_Label;;;;;;;;;;;;
;;;;RID_Class;;;;;;;;;;;;
;;;;PackingGroup;;;;;;;;;;;;
;;;;DangerousGoodsWeight;;;;;;;;;;;;
;;;;DangerousGoodsVolume;;;;;;;;;;;;
;;;;LimitedQuantityIndicator;;;;;;;;;;;;
;;;CombinedTrafficLoadProfile;;;;;;;;;;;;;
;;;;P1;;;;;;;;;;;;
;;;;P2;;;;;;;;;;;;
;;;;C1;;;;;;;;;;;;
;;;;C2;;;;;;;;;;;;
;;StatusOfHarmonization;;;;;;;;;;;;;;
;;;HandoverHarmonized;;;;;;;;;;;;;
;;;InterchangeHarmonized;;;;;;;;;;;;;
;;TrainActivity;;;;;;;;;;;;;;
;;;TrainActivityType;;;;;;;;;;;;;
;;;AssociatedAttachedTrainID*;;;;;;;;;;;;;
;;;AssociatedAttachedOTN;;;;;;;;;;;;;
;;OnDemandPath;;;;;;;;;;;;;;
;;PreArrangedPath;;;;;;;;;;;;;;
;;OperationalTrainNumber;;;;;;;;;;;;;;
;;NetworkSpecificParameter;;;;;;;;;;;;;;
;;;zugKennzeichen_n;;;;;;;;;;;;;
;;;zggHauptnummer;;;;;;;;;;;;;
;;;zggUnternummer;;;;;;;;;;;;;
;;;zggKurzbez;;;;;;;;;;;;;
;;;richtungswechselGrund;;;;;;;;;;;;;
;;;neigetechnik;;;;;;;;;;;;;
;;;streckenNummer;;;;;;;;;;;;;
;;;haltabwText;;;;;;;;;;;;;
;;;gleisNummer;;;;;;;;;;;;;
;;;traktionDampf;;;;;;;;;;;;;
;;;fahrtrichtDampf;;;;;;;;;;;;;
;;;hgRueckDampf;;;;;;;;;;;;;
;;;gegengleisBisTlp;;;;;;;;;;;;;
;;;richtungDesZugesBeiAbfahrt;;;;;;;;;;;;;
;;;richtungDesZugesBeiAnkunft;;;;;;;;;;;;;
;;;abstellung;;;;;;;;;;;;;
;;;bahnsteiglaengeNichtAusreich;;;;;;;;;;;;;
;;;anschlussBezeichnung_n;;;;;;;;;;;;;
;;;anschlussVerkehrlicheLinienNummer_n;;;;;;;;;;;;;
;;;anschlussAnkunftszeit_zeit_n;;;;;;;;;;;;;
;;;anschlussAnkunftszeit_offset_n;;;;;;;;;;;;;
;;;anschlussAbfahrtszeit_zeit_n;;;;;;;;;;;;;
;;;anschlussAbfahrtszeit_offset_n;;;;;;;;;;;;;
;;;konstruktionsrelevanteBeziehungBezeichnung;;;;;;;;;;;;;
;;;konstruktionsrelevanteBeziehungVerkehrlicheLiniennummer;;;;;;;;;;;;;
;;;entfernungZumNaechstenZlp;;;;;;;;;;;;;
;;;veroeffentlichungsArt;;;;;;;;;;;;;
;;;geplanteBetriebsstelle;;;;;;;;;;;;;
;;;gefahrgutGanzzug;;;;;;;;;;;;;
;;;tfzOderLeerfahrt;;;;;;;;;;;;;
;;;nvNummer;;;;;;;;;;;;;
;;;nvBis;;;;;;;;;;;;;
;;;nvIm;;;;;;;;;;;;;
;;;azchLocoTypeNumber;;;;;;;;;;;;;
;;;azchRolle;;;;;;;;;;;;;
;;;azchZggHauptnummer;;;;;;;;;;;;;
;;;azchZggUnternummer;;;;;;;;;;;;;
;;;azchZggKurzbez;;;;;;;;;;;;;
;;;kundennummerBestellendesEvu;;;;;;;;;;;;;
;;;kundennummerDurchfuehrendesEvu;;;;;;;;;;;;;
;;;kzLaermschutz;;;;;;;;;;;;;
;;;kzSicherheit;;;;;;;;;;;;;
;;;egbNr_n;;;;;;;;;;;;;
;PlannedCalendar;;;;;;;;;;;;;;;
;;BitmapDays;;;;;;;;;;;;;;
;;ValidityPeriod;;;;;;;;;;;;;;
;;;StartDateTime;;;;;;;;;;;;;
;;;EndDateTime;;;;;;;;;;;;;
;RequestedCalendar;;;;;;;;;;;;;;;
NetworkSpecificParameters;;;;;;;;;;;;;;;;
;marktProdukt;;;;;;;;;;;;;;;
;trassenpreis;;;;;;;;;;;;;;;
;baukorridorNr_n;;;;;;;;;;;;;;;
;baukorridorArt_n;;;;;;;;;;;;;;;
;oedlaKennzeichen;;;;;;;;;;;;;;;
;verkehrsArtKunde;;;;;;;;;;;;;;;
;verkehrsArtKundeZusatz;;;;;;;;;;;;;;;
;flexibilitaet;;;;;;;;;;;;;;;
;betrieblichePrio;;;;;;;;;;;;;;;
;betroffenheitBau;;;;;;;;;;;;;;;
Other Messages;;;;;;;;;;;;;;;;
RevisedRequest;;;;;;;;;;;;;;;;
AffectedSection;;;;;;;;;;;;;;;;
;StartOfSection;;;;;;;;;;;;;;;
;;CountryCodeISO;;;;;;;;;;;;;;
;;LocationPrimaryCode;;;;;;;;;;;;;;
;;PrimaryLocationName;;;;;;;;;;;;;;
;;LocationSubsidiaryIdentification*;;;;;;;;;;;;;;
;;BookedLocationDateTime;;;;;;;;;;;;;;
;;BookedLocationTime;;;;;;;;;;;;;;
;EndOfSection*;;;;;;;;;;;;;;;
;OperationalTrainNumber;;;;;;;;;;;;;;;
;PlannedCalendar;;;;;;;;;;;;;;;
;NetworkSpecificParameters*;;;;;;;;;;;;;;;
InterruptionInformation;;;;;;;;;;;;;;;;
;InterruptionDescription;;;;;;;;;;;;;;;
;InterruptionDateTime;;;;;;;;;;;;;;;
;InterruptionReason;;;;;;;;;;;;;;;
;InternalReferenceIdentifier;;;;;;;;;;;;;;;
RelatedReference;;;;;;;;;;;;;;;;
;RelatedType;;;;;;;;;;;;;;;
;RelatedIdentifier;;;;;;;;;;;;;;;
;RelatedMessageDateTime;;;;;;;;;;;;;;;
;RelatedSenderReference;;;;;;;;;;;;;;;
ErrorCauseReference;;;;;;;;;;;;;;;;
;MessageReference*;;;;;;;;;;;;;;;
;MessageSenderReference;;;;;;;;;;;;;;;
Error;;;;;;;;;;;;;;;;
;TagReference;;;;;;;;;;;;;;;
;TypeOfError;;;;;;;;;;;;;;;
;Severity;;;;;;;;;;;;;;;
;ErrorCode;;;;;;;;;;;;;;;
;FreeTextField;;;;;;;;;;;;;;;
FreeTextField;;;;;;;;;;;;;;;;
</pre>

## Gewünschtes Format


    <h4>
      <span>MessageHeader</span>
    </h4>
    <table class="wrapped">
      <colgroup>
        <col/>
        <col/>
        <col/>
        <col/>
        <col/>
        <col/>
      </colgroup>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Kardinalität</th>
          <th>Typ</th>
          <th>Datenlänge</th>
          <th>Beispiel</th>
          <th>Bemerkung</th>
        </tr>
        <tr>
          <td>MessageReference</td>
          <td>
            <br/>
          </td>
          <td>
            <br/>
          </td>
          <td>
            <br/>
          </td>
          <td>
            <br/>
          </td>
          <td>
            <br/>
          </td>
        </tr>
        <tr>
          <td colspan="1">MessageRoutingID</td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
        </tr>
        <tr>
          <td colspan="1">SenderReference</td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
        </tr>
        <tr>
          <td colspan="1">Sender</td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
        </tr>
        <tr>
          <td colspan="1">Recipient</td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
          <td colspan="1">
            <br/>
          </td>
        </tr>
      </tbody>
    </table>