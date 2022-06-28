module.exports = () => `@startuml
hide empty description
skinparam LineBackgroundColor #black
skinparam ArrowColor #black
skinparam state {
    BackgroundColor<<aslFail>> #red
    FontColor<<aslFail>> #white

    BackgroundColor<<aslTask>> #lightblue
    BackgroundColor<<Compensate>> #orange

    BackgroundColor<<aslSucceed>> #green
    FontColor<<aslSucceed>> #white
}
`;
