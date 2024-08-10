from flask import Flask, render_template, request, jsonify,session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
import os
from werkzeug.utils import secure_filename
import tensorflow as tf
import numpy as np
import cv2



 # Initialize Flask app
app = Flask(__name__)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = '60b705b6449d0ec72e93894d4c7afcc1ea5562ba5e5e860b'  # For session management

# Initialize the database and migration tool
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Create the database tables
with app.app_context():
    db.create_all()

# Handling Sign Up
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"status": "error", "message": "Account already registered"}), 400
    
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"status": "success", "message": "Account created successfully"})

# Handling Login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"status": "error", "message": "User does not exist"}), 404
    
    if not user.check_password(password):
        return jsonify({"status": "error", "message": "Incorrect password"}), 401

    # Successful login logic
    return jsonify({"status": "success","message": "Login successful!", "username": user.username})




tumor_info = {
    "PITUITARY": "Pituitary tumors are abnormal growths that develop in your pituitary gland. Some pituitary tumors result in too many of the hormones that regulate important functions of your body. Some pituitary tumors can cause your pituitary gland to produce lower levels of hormones.",
    "MENINGIOMA": "Meningiomas are tumors that arise from the meninges, the membranes that surround your brain and spinal cord. Most meningiomas are noncancerous, though a small percentage can be cancerous.",
    "GLIOMA": "Gliomas are a type of tumor that occurs in the brain and spinal cord. Gliomas begin in the glial cells that surround nerve cells and help them function.",
    "NO TUMOR": "Congrats! you don't need to be worry, if your syptoms persist make sure to visit a specialist."
    # Add more tumor types as needed
}

@app.route('/get_tumor_info', methods=['GET'])
def get_tumor_info():
    tumor_type = request.args.get('tumor_type')
    info = tumor_info.get(tumor_type.upper(), "Information not available for this tumor type.")
    return jsonify({"tumor_type": tumor_type, "info": info})

# Load the trained AI model
model = tf.keras.models.load_model('newestmodel.h5')

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image(file_path):
    image = cv2.imread(file_path)
    image_resized = cv2.resize(image, (256, 256))
    batch_size=32;
    batch = np.stack([image_resized] * batch_size, axis=0)
    return batch

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        file.save(filepath)

        try:
            processed_image = process_image(filepath)
            prediction = model.predict(processed_image)
            result = (np.argmax(prediction, axis=1))[0]

            label = ""
            if result == 0:
                label = "Glioma"
            elif result == 1:
                label = "Meningioma"
            elif result == 2:
                label = "No Tumor"
            elif result == 3:
                label = "Pituitary"
            elif result ==4 :
                label ="oops!! This is not a brain MRI image"

            return jsonify({'result': label})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file format'}), 400

if __name__ == '__main__':
   
    app.run(debug=True)
