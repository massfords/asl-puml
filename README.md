# asl-puml

[![license](https://img.shields.io/badge/MIT-blue.svg)](https://github.com/massfords/asl-puml/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/asl-puml.svg)](https://badge.fury.io/js/asl-puml)

[![NPM](https://nodei.co/npm/asl-puml.png?stars=true)](https://www.npmjs.com/package/asl-puml)

## What does it do?

Generates a plantuml state diagram from a valid [**Amazon States Language**](https://states-language.net/spec.html) file.

## But why? There's already good tooling from AWS.

The existing tools are good, but I'm looking for a simpler rendering that encodes a little more info than the AWS Toolkit. 

I also do all of my development in an IDE and don't want to switch to the browser based AWS Workflow Studio. 

## Example step function

See `__tests__/Definitions/demo.asl.json` for the step function used for these examples.

The diagrams below show the same step function rendered by:
- asl-puml (this library)
- AWS Toolkit
- AWS Workflow Studio

## Feature comparison 

| <br/><br/><br/>Feature or Style Requirement                           | asl-puml                                                                                                         | AWS Toolkit                                                                                                                      | AWS Workflow Studio                                                                                       |
|-----------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| renders the step function as a state diagram                          | ![Diagram of the step function in the style of a PlantUML State Diagram](./docs/asl-puml-rendering-demo.asl.png) | ![shows state machine rendered by AWS Toolkit with generic rendering for every state](./docs/aws-toolkit-rendering-demo.asl.png) | ![shows state machine in workflow studio with colors and icons](./docs/aws-studio-rendering-demo.asl.png) |
| conveys the behavior for the state                                    | :white_check_mark:, via colors and some icons                                                                    | :x:                                                                                                                              | :white_check_mark:, very familiar AWS icons and colors.                                                   |
| diagram matches the style seen in AWS Console for instance executions | :x:                                                                                                              | :white_check_mark:                                                                                                               | :x:                                                                                                       |
| renders the step function within Webstorm or other JetBrains products | :white_check_mark:, via the existing plantuml plugin                                                             | :x:, not in [AWS Toolkit for Webstorm](https://aws.amazon.com/webstorm/)                                                         | :x:                                                                                                       |
| renders the step function within VS Code                              | :white_check_mark:, via the existing plantuml plugin                                                             | :white_check_mark:, available in [AWS Toolkit for VS Code](https://aws.amazon.com/visualstudiocode/)                             | :x:                                                                                                       |
| label the path from a catch                                           | :white_check_mark:, with line weight and color                                                                   | :x:                                                                                                                              | :white_check_mark:, path is labeled with a Catch                                                          |
| label the path to a Fail state                                        | :white_check_mark:, with line weight and color                                                                   | :x:                                                                                                                              | :x:                                                                                                       |
| identify the compensation path (see description below)                | :white_check_mark:, albeit hard coded by state name regex                                                        | :x:                                                                                                                              | :x:                                                                                                       |
| label the state transition if conditional                             | :white_check_mark:, limited support with StringEquals                                                            | :x:                                                                                                                              | :white_check_mark:, expression is shown in a note on the line                                             |
| avoid drawing duplicate paths to reduce clutter (catches)             | :white_check_mark:                                                                                               | :white_check_mark:                                                                                                               | :x:, all paths are drawn                                                                                  |

### Compensation Path
The term "compensate" is borrowed from [business processes](http://docs.oasis-open.org/wsbpel/2.0/OS/wsbpel-v2.0-OS.html#_Toc164738526) where it refers to the undoing of work as part of handling a fault.

When reviewing a process, it's useful to identify which parts of the process are in service of the happy path 
versus those in the compensation path.

Currently, the library uses a regex to match on the state's name to decide if it's in the compensation path. This will
be made configurable as part of the theme. There isn't a good way to determine the compensation path without hints from
the config. 

## Install
```bash
# Use via the CLI
npm install -g asl-puml
# Use in your code
npm install asl-puml
```

## CLI
```bash
$ asl-puml --help

  Usage: asl-puml [options]

  Amazon States Language to PUML

  Options:

Amazon States Language to PUML

Options:
  -i --input <input>    path to input file
  -o --output <output>  path to output dir
  -h, --help            display help for command
```
Return status:
- `0` if diagram was generated
- `1` if there was an error

## In your code
```javascript
const aslPuml = require('asl-puml');
const definition = require('./path/to/my/state/machine/json/definition');
const { isValid, puml, message } = aslPuml(definition);
if (isValid) {
  console.log(puml)
} else {
  console.error(message);
}
```

## Test
```bash
npm run test
```

## Lint
```bash
npm run lint
```

## See also
- [ASL specifications](https://states-language.net/spec.html)
- [ASL documentation on AWS website](http://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [PlantUML state diagram documentation](https://plantuml.com/state-diagram)

## License
See [LICENSE](./LICENSE).
