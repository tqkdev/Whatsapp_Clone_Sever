import  express,{Express,Request,Response}  from "express";

const port = 3001;
const app:Express = express();

app.get("/",(req :Request, res: Response) =>{
    res.send('hellooo')
})



app.listen(port, () => {
    console.log(`Server is running....`);
});
