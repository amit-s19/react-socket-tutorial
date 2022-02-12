import './ExchangeTable.css';
import Table from 'react-bootstrap/Table';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { w3cwebsocket as W3CWebSocket } from "websocket";

let priceData = {};

function ExchangeTable() {
    const [tableData, setTableData] = useState([]);
    const [deltaSocket, setDeltaSocket] = useState();

    const [time, setTime] = useState(Date.now());

    // UseEffect to update component every 0.5 seconds
    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 100);
        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const getTableData = async () => {
            let apiResponse = await axios.get("https://api.delta.exchange/v2/products");
            let tickerSymbols = [];
            apiResponse.data.result.forEach(el => {
                tickerSymbols.push(el.symbol);
            })
            // const deltaSocket = new W3CWebSocket('wss://testnet-socket.delta.exchange');
            const deltaSocket = new W3CWebSocket('wss://production-esocket.delta.exchange');
            deltaSocket.onopen = () => {
                deltaSocket.send(JSON.stringify({
                    "type": "subscribe",
                    "payload": {
                        "channels": [
                            {
                                "name": "v2/ticker",
                                "symbols": tickerSymbols
                            }
                        ]
                    }
                }))
            }
            setDeltaSocket(deltaSocket);
            setTableData(apiResponse.data.result);
        }
        getTableData();
    }, [deltaSocket])

    useEffect(() => {
        if (deltaSocket) {
            deltaSocket.onmessage = (msg) => {
                let data = JSON.parse(msg.data);
                priceData = { ...priceData, [data.symbol]: data.mark_price };
            }
        }
    })

    return (
        <div className="container">
            <h1>React Socket Tutorial</h1>
            <h5>( Using Delta Exchange API )</h5>
            <Table striped bordered hover variant="dark" responsive >
                <thead id="tableId">
                    <tr>
                        <th>Symbol</th>
                        <th>Description</th>
                        <th>Underlying Asset</th>
                        <th>Mark Price</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        tableData?.map(option =>
                            <tr>
                                <td>{option.symbol}</td>
                                <td>{option.description}</td>
                                <td>{option.underlying_asset.symbol}</td>
                                <td>{priceData[option.symbol] ? priceData[option.symbol] : '------'}</td>
                            </tr>
                        )
                    }
                </tbody>
            </Table>
        </div>
    );
}

export default ExchangeTable;

