import { Router } from 'express';
import { addStudent, getAllStudents } from '../controllers/index';

const router: Router = Router();

router.get('/students', getAllStudents);
router.post('/student', addStudent);

export { router };
