# PAAA-PoC

This repository is a proof-of-concept for a versioned storage as per the Plazi Actionable Accessible Archive (PAAA) arhitecture.

The actual data is now here: https://git.ld.plazi.org/plazi/treatments-xml.git

![paaa-architecture drawio](https://user-images.githubusercontent.com/110756/151776949-221d2508-5e80-4312-ae49-c616121351f6.svg)

The repository contains all treatments in the Plazi Root Format GG-XML that pass the TreatmentBank Gatekeeper rules for LOD data, all other formats offered by Plazi can be derived from this format. [A GitHub Workflow](.github/workflows/main.yml) exemplifies the transformation to another format. It uses xalan and rapper to transform the documents to RDF whenever they are changed or added.

# Workflow: How Changes are translated to Synospecies

Changed XML is uploaded to this repository (currently this is always from TreatmentBank). All XML Documents and their history is available in the [data folder](data/) in this Git Repository.\
↓\
A webhook is sent to our server where https://github.com/plazi/gg2rdf transform all changed XML to RDF turtle.
<!-- A github action in this repository is immediatley triggered, this action transforms this XML to RDF Turtle,-->
to do so it uses this [XSLT](https://github.com/plazi/gg2rdf/blob/main/gg2rdf.xslt) and the [Raptor RDF Library](https://librdf.org/raptor/). [![transformation status](https://gg2rdf.ld.plazi.org/status)](https://gg2rdf.ld.plazi.org/status)\
↓\
The same Github Action uploads the genrated RDF to the [treatments-rdf repository](https://github.com/plazi/treatments-rdf)\
↓\
That repository triggers a Webhook on our server, where PSPS takes in the data and stores it in an internal triplestore.
(Exposed SPARQL-Endpoint at https://treatment.ld.plazi.org/sparql )\
↓\
PSPS then uploads all this data to lindas, which reloads itself every 24h, from where Synospecies gets its data by default

# GateKeeper rules
| source | destination | check | type | message  | 
| -------------- | ----------------------------- | ---------------------- | ---------- | ----------|
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'missingRank' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/missingRank | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'missingAuthority' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/missingAuthority | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'missingFamily' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/missingFamily | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'missingOrder' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/missingOrder | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'missingKingdom' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/missingKingdom | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'brokenFamily' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/brokenFamily | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'taxonomicNames']/type[./@name = 'brokenOrder' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | taxonomicNames/brokenOrder | Unresolved treatment taxon issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'missingTaxon' and $detailId and ./@errors-blocker > 0]) | treatments/missingTaxon | Unresolved treatment boundary issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'brokenBoundaries' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | treatments/brokenBoundaries | Unresolved treatment boundary issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'brokenStructure' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | treatments/brokenStructure | Unresolved treatment structure issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'missingStructure' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | treatments/missingStructure | Unresolved treatment structure issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'missingNomenclature' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | treatments/missingNomenclature | Unresolved treatment structure issues  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'spuriousTreatment' and $detailId and ./@errors-blocker > 0]) | treatments/spuriousTreatment | Treatment too small to be valid  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'mingledTreatments' and $detailId and ./@errors-blocker > 0]) | treatments/mingledTreatments | Treatment might be aggregate of multiple treatments  | 
| SRS | LOD | (./category[./@name = 'treatments']/type[./@name = 'brokenReferenceGroup' and $detailId and (./@errors-blocker > 0 or ./@errors-critical > 0)]) | treatments/brokenReferenceGroup | Reference group cites suspicious taxon names  | 
| // | fallback for missing error protocol: uploaded 2020-06-01 or later  | 
| SRS | LOD | (./@checkinTime > 1590926399000) | document/missingQc | QC is required for LOD export of treatments extracted from IMF documents uploaded after 2020-05-31  | 
|   | 
