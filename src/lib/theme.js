module.exports = (_definition, _state_map) => {
    return `
@startuml
hide empty description
skinparam LineBackgroundColor #black
skinparam ArrowColor #black
skinparam state {
    BackgroundColor<<aslFail>> #red
    FontColor<<aslFail>> #white

    BackgroundColor<<aslSucceed>> #green
    FontColor<<aslSucceed>> #white
}
`
}