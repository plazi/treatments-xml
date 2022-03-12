# PAAA-PoC

This repository is a proof-of-concept for a versioned storage as per the Plazi Actionable Accessible Archive (PAAA) arhitecture.

![paaa-architecture drawio](https://user-images.githubusercontent.com/110756/151776949-221d2508-5e80-4312-ae49-c616121351f6.svg)

The repository contains all treatments in the Plazi Root Format GG-XML, all other formats offered by Plazi can be derived from this format. [A GitHub Workflow](.github/workflows/main.yml) exemplifies the transformation to another format. It uses xalan and rapper to transform the documents to RDF whenever they are changed or added.
