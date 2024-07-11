import { Request, Response, NextFunction } from 'express';
import { firestoredatabase } from '../database/Firebase';
import Student from '../model/index';

import { CollectionReference, DocumentData } from 'firebase/firestore';
import { collection, addDoc, getDocs, doc } from 'firebase/firestore';

const addStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        await addDoc(collection(firestoredatabase, 'students'), data);
        res.send('Record saved successfully');
    } catch (error) {
        res.status(400).send('loi add');
    }
};

const getAllStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentsCollection: CollectionReference<DocumentData> = collection(firestoredatabase, 'students');
        const data = await getDocs(studentsCollection);
        const studentsArray: Student[] = [];
        if (data.empty) {
            res.status(404).send('No student record found');
        } else {
            data.forEach((doc) => {
                const studentData = doc.data();
                const student = new Student(doc.id, studentData.firstName, studentData.lastName);
                studentsArray.push(student);
            });
            res.send(studentsArray);
        }
    } catch (error) {
        res.status(400).send('loi getall');
    }
};

export { addStudent, getAllStudents };
