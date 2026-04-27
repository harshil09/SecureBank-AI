from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
   

class Transactions(BaseModel):
    #user_id:int
    amount: float
    