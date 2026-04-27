def newf(*args):
    return sum(args)

print(newf(1,34,23))



def name(**kwargs):
    for key,value in kwargs.items():
        print(f"{key}, {value}")



name(name="harshil",age=20)


def addition(a,b):
    return a*b, a+b

c,d=addition(4,5)
print(c)
print(d)
