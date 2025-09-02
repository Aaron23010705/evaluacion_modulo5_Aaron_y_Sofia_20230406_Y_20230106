import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { database } from '../config/firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

// Función para eliminar un empleado de Firestore
const handleDelete = async (id, nombre) => {
    Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar al empleado ${nombre}?`,
        [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(database, 'empleados', id));
                        console.log('Se eliminó el empleado con id: ', id);
                        Alert.alert('Éxito', 'Empleado eliminado correctamente');
                    } catch (e) {
                        console.error('Error removing document: ', e);
                        Alert.alert('Error', 'No se pudo eliminar el empleado');
                    }
                }
            },
        ]
    );
};

// Función para cambiar el estado activo del empleado
const handleToggleStatus = async (id, activo, nombre) => {
    const nuevoEstado = !activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    Alert.alert(
        'Confirmar cambio de estado',
        `¿Deseas ${accion} al empleado ${nombre}?`,
        [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Confirmar',
                onPress: async () => {
                    try {
                        await updateDoc(doc(database, 'empleados', id), {
                            activo: nuevoEstado
                        });
                        console.log('Se actualizó el estado del empleado con id: ', id);
                        Alert.alert('Éxito', `Empleado ${accion} correctamente`);
                    } catch (e) {
                        console.error('Error updating document: ', e);
                        Alert.alert('Error', 'No se pudo actualizar el estado del empleado');
                    }
                }
            },
        ]
    );
};

// Componente funcional que representa una tarjeta de empleado
const CardEmpleados = ({ 
    id, 
    nombre, 
    correo, 
    edad, 
    especialidad, 
    telefono, 
    puesto, 
    salario, 
    fechaIngreso, 
    activo 
}) => {
    const navigation = useNavigation();

    // Función para navegar a la pantalla de edición
    const handleEdit = () => {
        navigation.navigate('EditEmpleado', {
            empleadoId: id,
            empleadoData: {
                nombre,
                correo,
                edad,
                especialidad,
                telefono,
                puesto,
                salario,
                activo
            }
        });
    };

    // Función para formatear la fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return 'No disponible';
        
        let fechaObj;
        if (fecha.toDate && typeof fecha.toDate === 'function') {
            // Es un timestamp de Firestore
            fechaObj = fecha.toDate();
        } else if (fecha instanceof Date) {
            fechaObj = fecha;
        } else {
            return 'Fecha inválida';
        }
        
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <View style={[styles.card, !activo && styles.cardInactive]}>
            {/* Header con nombre y estado */}
            <View style={styles.header}>
                <Text style={styles.nombre}>{nombre}</Text>
                <View style={[styles.statusBadge, activo ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>
                        {activo ? "Activo" : "Inactivo"}
                    </Text>
                </View>
            </View>

            {/* Información básica */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    <Text style={styles.label}>Correo: </Text>
                    {correo}
                </Text>
                
                <Text style={styles.infoText}>
                    <Text style={styles.label}>Edad: </Text>
                    {edad} años
                </Text>
                
                <Text style={styles.infoText}>
                    <Text style={styles.label}>Especialidad: </Text>
                    {especialidad}
                </Text>

                {puesto && (
                    <Text style={styles.infoText}>
                        <Text style={styles.label}>Puesto: </Text>
                        {puesto}
                    </Text>
                )}

                {telefono && (
                    <Text style={styles.infoText}>
                        <Text style={styles.label}>Teléfono: </Text>
                        {telefono}
                    </Text>
                )}

                {salario > 0 && (
                    <Text style={styles.infoText}>
                        <Text style={styles.label}>Salario: </Text>
                        ${salario.toFixed(2)} USD
                    </Text>
                )}

                <Text style={styles.infoText}>
                    <Text style={styles.label}>Fecha de ingreso: </Text>
                    {formatearFecha(fechaIngreso)}
                </Text>
            </View>

            {/* Botones de acción */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEdit}>
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusButton, activo ? styles.deactivateButton : styles.activateButton]}
                    onPress={() => handleToggleStatus(id, activo, nombre)}>
                    <Text style={styles.statusButtonText}>
                        {activo ? "Desactivar" : "Activar"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(id, nombre)}>
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Estilos del componente
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        margin: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    cardInactive: {
        backgroundColor: '#f5f5f5',
        borderLeftColor: '#ff9800',
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    nombre: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    activeBadge: {
        backgroundColor: '#e8f5e8',
    },
    inactiveBadge: {
        backgroundColor: '#fff3e0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    infoContainer: {
        marginBottom: 16,
    },
    infoText: {
        fontSize: 14,
        marginBottom: 6,
        color: '#555',
        lineHeight: 20,
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: '#2196f3',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        flex: 1,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    statusButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        flex: 1,
    },
    activateButton: {
        backgroundColor: '#4caf50',
    },
    deactivateButton: {
        backgroundColor: '#ff9800',
    },
    statusButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    deleteButton: {
        backgroundColor: '#f44336',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        flex: 1,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
});

export default CardEmpleados;