import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CoolLoader from '../components/CoolLoader';
import { ArrowRight, KeyRound } from 'lucide-react';

const JoinProject = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const joinProject = async () => {
      try {
        const res = await axios.post(`/projects/join/${code}`);
        setResult(res.data);
        toast.success(`Joined ${res.data.project.title}.`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Unable to join with this invite code.');
      } finally {
        setLoading(false);
      }
    };

    joinProject();
  }, [code]);

  if (loading) {
    return <CoolLoader title="Checking invite" subtitle="Adding you to the project team..." />;
  }

  return (
    <div className="join-page">
      <section className="card join-card">
        <span className="badge badge-info">
          <KeyRound size={14} />
          Invite code
        </span>
        <h1>{result ? 'You are on the team' : 'Invite could not be accepted'}</h1>
        <p>
          {result
            ? `You joined ${result.project.title}. You can now open the workspace and start collaborating.`
            : 'The code may be expired, mistyped, or already invalid.'}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate(result ? `/projects/${result.project.id}#team` : '/dashboard')}
        >
          {result ? 'Open team workspace' : 'Back to dashboard'}
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
};

export default JoinProject;
