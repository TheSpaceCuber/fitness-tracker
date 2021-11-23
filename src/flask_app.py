#!/usr/bin/env python3

# FLASK app to perform CRD on MongoDB
#####################################
from flask import Flask, request
from flask.json import jsonify
from flask_cors import cross_origin
from pymongo import MongoClient
from numpy.polynomial.polynomial import Polynomial
import flask, logging, os


##### Flask Setup #####
app = Flask(__name__)
app.debug = False

SECRET_KEY = "<OWN_SECRET_KEY>"

##### MongoDB Setup #####
mongoClient = MongoClient('mongodb://localhost:27017/')
db = mongoClient['cs3237']
col = db['data']

##### Other setup #####
logger = logging.getLogger(__name__)
filehandle = logging.FileHandler(f"{os.path.splitext(__file__)[0]}.log", mode="a")
formatter = logging.Formatter('%(asctime)s : %(levelname)s - %(message)s')
filehandle.setFormatter(formatter)
logger.addHandler(filehandle)

logger.setLevel(logging.INFO)

def verify():
    key = request.headers.get("Authorization")
    if key == SECRET_KEY:
        return
    flask.abort(401)

def extract_exercises(result):
    bp_array, bc_array, squat_array = [], [], []
    for x in result:
        bp_dict, squat_dict = x['benchPress'], x['squat']
        bp, bc, squat = -1, -1, -1
        for k in bp_dict:
            bp = max(bp, int(bp_dict[k][0]))
        if bp != -1: bp_array.append(bp)
        #for k in bc_dict:
            #bc = max(bc, int(bc_dict[k][0]))
        #if bc != -1: bc_array.append(bc)
        for k in squat_dict:
            squat = max(squat, int(squat_dict[k][0]))
        if squat != -1: squat_array.append(squat)
    return bp_array, bc_array, squat_array

@app.route("/retrieve", methods=["GET"])
@cross_origin()
def retrieve():
    verify()
    userid = request.args.get('user_id', None)
    result = col.find({'user_id': userid}, {"_id": False})
    result = [x for x in result]
    # predictive algorithm here
    bp_array, bc_array, squat_array = extract_exercises(result)
    predictions = {'benchPress': 0, 'bicepCurl': 0, 'squat': 0}
    if len(bp_array) > 3:
        y = Polynomial.fit(list(range(len(bp_array))), bp_array, 2)
        for i, coeff in enumerate(y.coef):
            predictions['benchPress'] += coeff * len(bp_array) ** i
    print(predictions)
    try:
        response = jsonify(result)
        return response
    except TypeError:
        return "Output Error"

@app.route("/upload", methods=["POST"])
@cross_origin()
def upload():
    verify()
    try:
        new_rec = request.get_json()
        logger.debug(f"Uploaded: {new_rec}")
        if new_rec is not None:
            col.insert_one(new_rec)
        return 'OK', 200
    except Exception as e:
        logger.error(e)
        return e, 400

@app.route("/delete", methods=["DELETE"])
@cross_origin()
def delete():
    verify()
    userid = request.args.get('user_id', None)
    index = request.args.get('index', None, type=int)
    count = 0
    if index is None:
        # x = col.delete_many({"user_id": userid})
        # count = x.deleted_count
        pass
    else:
        result = col.find({'user_id': userid})
        result = [x for x in result]
        
        if index < len(result):
            x = col.delete_one({"_id": result[index]['_id']})
            count = x.deleted_count
    return f"{count} deleted!", 200

if __name__ == "__main__":
    from waitress import serve
    logger.info("Flask started!")
    try:
        serve(app, host="0.0.0.0", port="5000")
    finally:
        logger.info("Flask ended!")
