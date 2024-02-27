# Example Application using Streamdal's Kafkajs Shim

This is an example application that uses Streamdal's Kafkajs Shim.

##### Prerequisites

You must have Kafka and the Streamdal Platform running. To run them all locally using docker simply:

```
docker compose up
```

###
In `/kafka/kafkajs-shim`:

```
npm install
```

##### Run the app
``` 
npm start
```

This will fire up an example Kafka Producer that will send messages to Kafka on 
an interval and a couple Kafka Consumers that will consumer those messages. 

Once running, go to `http://localhost:8080` and you will see the above operations
were automatically instrumented and you are now able to create and add pipelines 
to them.

![Console](./console-screenshot.png)


