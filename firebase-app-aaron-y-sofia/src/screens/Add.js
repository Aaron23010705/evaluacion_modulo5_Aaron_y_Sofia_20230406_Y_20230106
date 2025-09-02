import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { database } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

// Componente Add para agregar un nuevo producto
const Add = ({ navigation }) => {
    // Estado inicial del producto
    const [producto, setProducto] = useState({
        nombre: '',
        precio: 0,
        vendido: false,
        creado: new Date(),
        imagen: ''
    });

    // Función para navegar a la pantalla de inicio
    const goToHome = () => {
        navigation.navigate('Home');
    };

    // Función para agregar el producto a Firestore
    const agregarProducto = async () => {
        try {
            console.log('Datos del producto:', producto);
            await addDoc(collection(database, 'productos'), producto);
            console.log('Se guardó la colección');

            Alert.alert('Producto agregado', 'El producto se agregó correctamente', [
                { text: 'Ok', onPress: goToHome },
            ]);

            goToHome();
        } catch (error) {
            console.error('Error al agregar el producto', error);
            Alert.alert('Error', 'Ocurrió un error al agregar el producto. Por favor, intenta nuevamente.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Agregar producto</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre:</Text>
                <TextInput
                    style={styles.input}
                    onChangeText={text => setProducto({ ...producto, nombre: text })}
                    value={producto.nombre}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Precio:</Text>
                <TextInput
                    style={styles.input}
                    onChangeText={text => setProducto({ ...producto, precio: parseFloat(text) })}
                    value={producto.precio.toString()}
                    keyboardType='numeric'
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={agregarProducto}>
                <Text style={styles.buttonText}>Agregar producto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={goToHome}>
                <Text style={styles.buttonText}>Volver a home</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Add;

// Estilos del componente
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        paddingLeft: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        width: '100%'
    },
    button: {
        backgroundColor: '#0288d1',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    inputContainer: {
        width: '100%',
        padding: 16,
        backgroundColor: '#f8f9fa',
        marginBottom: 16,
    },
});