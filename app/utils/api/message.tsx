export interface Message {
    lst_time: string,
    message: []
}

export class NastoolMessage {
    ws: WebSocket
    constructor(wsUrl: string, options: any | undefined = undefined) {
        this.ws = new WebSocket(wsUrl)
        this.ws.binaryType = 'blob'

        this.ws.onmessage = ((event:MessageEvent<string>) => {
            const message = JSON.parse(event.data);
            console.log('on message', event)
            this.handle_message(message);
        })
        this.ws.onopen = (event) => {
            console.log('on open', event)
            this.ws.send(JSON.stringify({ lst_time: "" }))
        }
        this.ws.onerror = (event) => {
            console.log('on error', event)
        }
    }

    private handle_message(message: Message) {

    }
}