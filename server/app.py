from flask import Flask
from routes import loan_routes, pool_routes
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

app.register_blueprint(pool_routes)
app.register_blueprint(loan_routes)