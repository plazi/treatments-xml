# PAAA-PoC

This repository is a proof-of-concept for a versioned storage as per the Plazi Actionable Accessible Archive (PAAA) arhitecture.

![paaa-architecture drawio](https://user-images.githubusercontent.com/110756/151776949-221d2508-5e80-4312-ae49-c616121351f6.svg)

The repository contains all treatments in the Plazi Root Format GG-XML, all other formats offered by Plazi can be derived from this format. [A GitHub Workflow](.github/workflows/main.yml) exemplifies the transformation to another format. It uses xalan and rapper to transform the documents to RDF whenever they are changed or added.

# Workflow: How Changes are translated to Synospecies

Changed XML is uploaded to this repository (currently this is always from TreatmentBank). All XML Documents and their history is available in the [data folder](data/) in this Git Repository.\
↓\
A github action in this repository is immediatley triggered, this action transforms this XML to RDF Turtle, to do so it uses this [XSLT](gg2rdf.xslt) and the [Raptor RDF Library](https://librdf.org/raptor/). [![transformation status](https://github.com/plazi/treatments-xml/actions/workflows/use-action.yml/badge.svg)](https://github.com/plazi/treatments-xml/actions/workflows/use-action.yml)\
↓\
The same Github Action uploads the genrated RDF to the [treatments-rdf repository](https://github.com/plazi/treatments-rdf)\
↓\
That repository triggers a Webhook on our server, where PSPS takes in the data and stores it in an internal triplestore.
(Exposed SPARQL-Endpoint at https://treatment.ld.plazi.org/sparql )\
↓\
PSPS then uploads all this data to lindas, which reloads itself every 24h, from where Synospecies gets its data by default
