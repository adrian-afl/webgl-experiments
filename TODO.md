1. Try to make an abstraction that is completely serializable
    what I mean is that the WHOLE system runs on serializable input and output (output is rare)
    this would allow it to be used via network, by sending serializable commands via the websockets, both ways, or perhaps events, or messages, WHO CARES
    This would in turn allow me to:
      - define a common rendering api that could be implemented in a variety of ways, not neccesarily via network
      - work on my stupid mac even after I switch to c++
