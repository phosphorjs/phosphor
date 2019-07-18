# Governance of PhosphorJS

Chief Executive: S. Chris Colbert (@sccolbert)

Package Maintainers:

* `algorithm`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `application`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `collections`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `commands`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `coreutils`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `datagrid`:
  S. Chris Colbert (@sccolbert)
* `datastore`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `default-theme`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `disposable`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `domutils`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `dragdrop`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `keyboard`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `messaging`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `properties`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `signaling`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `virtualdom`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)
* `widgets`:
  S. Chris Colbert (@sccolbert),
  Afshin T. Darian (@afshin),
  Steven Silvester (@blink1073)

## Principles of PhosphorJS

* Take time to design and implement APIs that will stand the test of time.
* Adopt minimal external dependencies.
* Packages should have as narrow a scope as possible and solve one problem.
* Performance matters. Always sweat the details.
* Keep public APIs as minimal as possible.
* Packages should be loosely coupled and useful on their own.
* Offer exceptionally clean implementation.
* Build escape hatches into the APIs for extensibility.
* PhosphorJS is about code, documentation, and technical excellence. Leave
  non-technical discussions and opinions at the door.
* Code of Conduct: Be nice.

## Governance Model

* PhosphorJS is governed by a group of Package Maintainers and a Chief Executive,
  that lead the project.
* Package Maintainers are responsible for one or more PhosphorJS packages. Each
  package shall have one or more maintainers.
* A broader group of Contributors works with the Package Maintainers and Chief
  Executive on the code base and documentation of the Project.
* Package Maintainers shall individually be responsible:
  - To make technical, API, and design decisions related to their Package;
  - To consult with and build consensus among other Package Maintainers and
    contributors;
  - To work with other contributors to develop and maintain the source code and
    documentation of their Package;
  - To maintain a roadmap for the Package, updated on a quarterly basis;
  - To maintain the API and narrative documentation of their Package;
  - To ensure the software in their Package follows the principles of PhosphorJS;
  - To maintain GitHub issues that track work related to the Package.
* The Chief Executive shall be responsible:
  - To maintain the principles of PhosphorJS to guide the work of the project;
  - To veto the approval of any Package Pull Requests;
  - To veto any votes taken by the Package Maintainers;
  - To provide senior technical and strategic input for the Packages and their
    roadmaps;
  - To act as a "super maintainer" of all packages;
  - To cast a deciding vote in case of a tie in a vote of the Package
    Maintainers.
* Technical decisions that span multiple Packages shall be made by a majority
  vote of the package maintainers.
* Organizational and governance decisions shall be made by a 2/3 vote of the
  Package Maintainers and explicit approval of the Chief Executive.
* New package maintainers can be nominated by any Package Maintainer, and
  approved by a majority vote of the current Package Maintainers.
* Releases shall be approved by majority vote of the package maintainers.
  Package maintainers can be removed by a 2/3 vote of no confidence of the other
  Package Maintainers, or by the Chief Executive for flagrant violation of one
  or more project principles.
* New Packages can be proposed by any Package Maintainer. Such proposals must
  identify a Package Maintainer for the new Package, and be approved by majority
  vote of the Package Maintainers. If the Package Maintainer of the new Package
  is not already a current Package Maintainer, the proposing Package Maintainer
  shall mentor the new Package Maintainer for a 6 month period.
