import os
import cv2
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.preprocessing.image import ImageDataGenerator

def load_images_from_folder(folder, target_size=(100, 100), valid_extensions=['.jpg', '.jpeg', '.png']):
    images = []
    labels = []

    for label in os.listdir(folder):
        label_folder = os.path.join(folder, label)
        if os.path.isdir(label_folder):
            for filename in os.listdir(label_folder):
                img_path = os.path.join(label_folder, filename)
                _, ext = os.path.splitext(img_path)
                if ext.lower() in valid_extensions:
                    img = cv2.imread(img_path)
                    if img is not None:
                        img_resized = cv2.resize(img, target_size)
                        img_gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
                        img_normalized = img_gray / 255.0
                        img_normalized = np.expand_dims(img_normalized, axis=-1)
                        images.append(img_normalized)
                        labels.append(label)

    images = np.array(images)
    labels = np.array(labels)

    return images, labels

dataset_dir = r"/home/rojin/Rojin/BrainTumorDataset/dataset/Testing"
images, labels = load_images_from_folder(dataset_dir)

label_encoder = LabelEncoder()
integer_encoded = label_encoder.fit_transform(labels)
y_onehot = to_categorical(integer_encoded)

X_train, X_test, y_train, y_test = train_test_split(images, y_onehot, test_size=0.2, random_state=42)

datagen = ImageDataGenerator(
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True
)

model = Sequential()
model.add(Conv2D(32, (3, 3), activation='relu', input_shape=(100, 100, 1)))
model.add(MaxPooling2D((2, 2)))
model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D((2, 2)))
model.add(Conv2D(128, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D((2, 2)))
model.add(Conv2D(128, (3, 3), activation='relu'))
model.add(BatchNormalization())
model.add(MaxPooling2D((2, 2)))
model.add(Dense(4, activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

history = model.fit(datagen.flow(X_train, y_train, batch_size=32), epochs=50, validation_data=(X_test, y_test))

loss, accuracy = model.evaluate(X_test, y_test)
print("Test Loss:", loss)
print("Test Accuracy:", accuracy)

model.save('model.h5')
