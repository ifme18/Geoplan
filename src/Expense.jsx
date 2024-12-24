import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Card } from 'react-native-paper';

const ExpensesScreen = () => {
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0.0);
  const [loading, setLoading] = useState(true);

  // Function to add an expense
  const addExpense = async () => {
    if (!expenseType || !amount || !description) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await firestore().collection('expenses').add({
        type: expenseType,
        amount: parseFloat(amount),
        description: description,
        date: firestore.Timestamp.now(),
      });

      // Clear input fields
      setExpenseType('');
      setAmount('');
      setDescription('');

      alert("Expense added successfully!");
      
      calculateTotalExpenses(); // Recalculate total expenses after addition
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  };

  // Function to calculate total expenses
  const calculateTotalExpenses = async () => {
    const snapshot = await firestore().collection('expenses').get();
    const total = snapshot.docs.reduce((sum, doc) => (
      sum + (doc.data().amount || 0)
    ), 0);
    setTotalExpenses(total);
  };

  // useEffect hook to run calculation on component mount
  useEffect(() => {
    const fetchData = async () => {
      await calculateTotalExpenses();
      setLoading(false);
    };

    fetchData();
  }, []);

  // Loading indicator while fetching data
  if (loading) {
    return <ActivityIndicator size="large" color="green" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add New Expense:</Text>

      <TextInput
        style={styles.input}
        placeholder="Expense Type"
        value={expenseType}
        onChangeText={setExpenseType}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <Button title="Save Expense" onPress={addExpense} color="green" />

      <Text style={styles.totalExpenses}>Total Expenses: KES {totalExpenses.toFixed(2)}</Text>

      <Text style={styles.header}>Expenses List:</Text>
      <ExpensesList />
    </ScrollView>
  );
};

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('expenses')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(expenseData);
      });

    return () => unsubscribe();
  }, []);

  return (
    <View>
      {expenses.map((expense) => (
        <Card key={expense.id} style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{expense.type}</Text>
            <Text>Amount: KES {expense.amount.toFixed(2)}</Text>
            <Text>Description: {expense.description}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  totalExpenses: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'green',
    marginVertical: 16,
  },
  card: {
    marginVertical: 8,
    padding: 10,
    borderRadius: 5,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ExpensesScreen;